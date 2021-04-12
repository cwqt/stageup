import {
  ErrCode,
  HostOnboardingStep,
  HostPermission,
  IHost,
  IHostOnboarding,
  HostOnboardingState,
  IHostPrivate,
  IOnboardingOwnerDetails,
  IOnboardingProofOfBusiness,
  IOnboardingSocialPresence,
  IOnboardingStep,
  IUserHostInfo,
  pick,
  HTTP,
  IHostMemberChangeRequest,
  IOnboardingStepMap,
  IEnvelopedData,
  HostInviteState,
  IPerformanceStub,
  IHostStub,
  TokenProvisioner,
  hasRequiredHostPermission,
  IHostStripeInfo,
  IHostInvoice,
  JobType,
  IHostInvoiceCSVJobData
} from '@core/interfaces';

import {
  Validators,
  body,
  params as parameters,
  query,
  BaseController,
  IControllerEndpoint,
  ErrorHandler,
  getCheck,
  User,
  Host,
  HostInvitation,
  UserHostInfo,
  Onboarding,
  OnboardingReview,
  Performance,
  AccessToken,
  Invoice,
  array
} from '@core/shared/api';

import { timestamp } from '@core/shared/helpers';

import Env from '../env';
import Email = require('../common/email');
import IdFinderStrat from '../common/authorisation/id-finder-strategies';
import AuthStrat from '../common/authorisation';
import { log } from '../common/logger';
import { BackendProviderMap } from '..';
import { In } from 'typeorm';
import Queue from '../common/queue';

export default class HostController extends BaseController<BackendProviderMap> {
  createHost(): IControllerEndpoint<IHost> {
    return {
      validators: [
        body<{
          email_address: IHostPrivate['email_address'];
          username: IHost['username'];
          name: IHost['name'];
        }>({
          email_address: v => Validators.Fields.email(v),
          username: v => Validators.Fields.username(v),
          name: v => Validators.Fields.name(v)
        })
      ],
      authStrategy: AuthStrat.runner(
        { uid: IdFinderStrat.findUserIdFromSession },
        AuthStrat.userEmailIsVerified(m => m.uid)
      ),
      controller: async req => {
        // Make sure user is not already part of a host
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (user.host) throw new ErrorHandler(HTTP.Conflict, ErrCode.DUPLICATE);

        // Check if the username for a host is already taken
        const h = await Host.findOne({ username: req.body.username });
        if (h) throw new ErrorHandler(HTTP.Conflict, ErrCode.IN_USE);

        // Create host & add current user (creator) to it through transaction
        // & begin the onboarding process by running .setup()
        return this.ORM.transaction(async txc => {
          const host = await txc.save(
            new Host({
              username: req.body.username,
              name: req.body.name,
              email_address: req.body.email_address
            })
          );

          // Save before setup because onboarding process depends on PK existing
          await host.setup(user, txc);
          await host.addMember(user, HostPermission.Owner, txc);

          return (await txc.save(host)).toFull();
        });
      }
    };
  }

  readHost(): IControllerEndpoint<IHost> {
    return {
      validators: [],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        const host = await Host.findOne(
          { _id: req.params.hid },
          {
            relations: {
              members_info: {
                user: true
              }
            }
          }
        );

        return host.toFull();
      }
    };
  }

  readHostByUsername(): IControllerEndpoint<IHost> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const host = await getCheck(Host.findOne({ username: req.params.username }));
        return host.toFull();
      }
    };
  }

  readMembers(): IControllerEndpoint<IEnvelopedData<IUserHostInfo[], null>> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        return await this.ORM.createQueryBuilder(UserHostInfo, 'uhi')
          .where('uhi.host__id = :host_id', { host_id: req.params.hid })
          .innerJoinAndSelect('uhi.user', 'user')
          .paginate(uhi => uhi.toFull());
      }
    };
  }

  deleteHost(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
        if (!user.host) throw new ErrorHandler(HTTP.NotFound, ErrCode.NOT_MEMBER);

        const userHostInfo = await UserHostInfo.findOne({
          relations: ['user', 'host'],
          where: {
            user: { _id: user._id },
            host: { _id: user.host._id }
          }
        });

        if (userHostInfo.permissions !== HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);

        // TODO: transactionally remove performances, signing keys, host infos etc etc.
        await user.host.remove();
      }
    };
  }

  //router.post<IUserHostInfo>("/hosts/:hid/members", Hosts.addMember());
  addMember(): IControllerEndpoint<IUserHostInfo> {
    return {
      validators: [body<IHostMemberChangeRequest>(Validators.Objects.IHostMemberChangeRequest())],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const changeRequest: IHostMemberChangeRequest = req.body;

        // Check invited user not already part of a host in any capacity
        const invitee = await getCheck(
          User.findOne({ email_address: changeRequest.value as string }, { relations: ['host'] })
        );
        if (invitee.host) throw new ErrorHandler(HTTP.Conflict, ErrCode.DUPLICATE);

        // Don't allow duplicate invites to be created for a user for the same host
        if (
          await HostInvitation.findOne({
            where: {
              invitee: {
                _id: invitee._id
              },
              host: {
                _id: req.params.hid
              }
            }
          })
        )
          throw new ErrorHandler(HTTP.Conflict, ErrCode.DUPLICATE);

        // Get host & pull in members_info for new member push
        const host = await getCheck(
          Host.findOne(
            { _id: req.params.hid },
            {
              relations: {
                members_info: {
                  user: true
                }
              },
              select: {
                members_info: {
                  user: {
                    _id: true
                  }
                }
              }
            }
          )
        );

        // Get the person making this request for invitation
        const inviter = await getCheck(User.findOne({ _id: req.session.user._id }));

        // Add member to host as 'Pending', create an invitation & submit the invitation e-mail
        await this.ORM.transaction(async txc => {
          await host.addMember(invitee, HostPermission.Pending, txc);
          await txc.save(host);

          // Fire & forget send e-mail, otherwise holds up the thread waiting for a response from sendgrid
          Email.sendUserHostMembershipInvitation(inviter, invitee, host, txc);
        });

        // Return newly added user UserHostInfo
        return host.members_info.find(uhi => uhi.user?.email_address == changeRequest.value).toFull();
      }
    };
  }

  handleHostInvite(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.hasSpecificHostPermission(HostPermission.Pending),
      controller: async req => {
        const invite = await getCheck(
          HostInvitation.findOne(
            { _id: req.params.iid },
            { relations: ['invitee'], select: { invitee: { _id: true } } }
          )
        );

        // Only accept the request if the logged in user matches the invites' user
        if (invite.invitee._id !== req.session.user._id) throw new ErrorHandler(HTTP.BadRequest, ErrCode.INVALID);

        const uhi = await getCheck(
          UserHostInfo.findOne({
            relations: ['user'],
            where: {
              user: {
                _id: req.session.user._id
              }
            }
          })
        );

        // Ensure the invite has not expired
        if (timestamp() > invite.expires_at) {
          // TODO: have task runner set to expired
          invite.state = HostInviteState.Expired;
          await invite.save();
          return `${Env.FE_URL}?invite_state=${HostInviteState.Expired}`;
        }

        // Otherwise accept the user into the host
        await this.ORM.transaction(async txc => {
          invite.state = HostInviteState.Accepted;
          uhi.permissions = HostPermission.Member;

          await Promise.all([txc.save(invite), txc.save(uhi)]);
        });

        return `${Env.FE_URL}?invite_accepted=${HostInviteState.Accepted}`;
      }
    };
  }

  // router.put <IHost> ("/hosts/:hid/members/:mid", Hosts.updateMember());
  updateMember(): IControllerEndpoint<void> {
    return {
      validators: [body<IHostMemberChangeRequest>(Validators.Objects.IHostMemberChangeRequest())],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const userHostInfo = await getCheck(
          UserHostInfo.findOne({
            relations: ['user', 'host'],
            where: {
              user: { _id: req.params.uid },
              host: { _id: req.params.hid }
            }
          })
        );

        // Don't be able to force increase permissions if the user hasn't accepted the invitation
        if (hasRequiredHostPermission(userHostInfo.permissions, HostPermission.Member))
          throw new ErrorHandler(HTTP.Forbidden, ErrCode.NOT_MEMBER);

        // Don't allow updating to Owner as that is a transfer of host ownership
        const newUserPermission: HostPermission = req.body.value;
        if (newUserPermission == HostPermission.Owner) throw new ErrorHandler(HTTP.Unauthorised);

        // Don't allow admins to demote an Owner
        if (userHostInfo.permissions == HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);

        userHostInfo.permissions = newUserPermission;
        await userHostInfo.save();
      }
    };
  }

  // router.delete <void>("/hosts/:hid/members/:uid", Hosts.removeMember());
  removeMember(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const userHostInfo = await getCheck(
          UserHostInfo.findOne({
            relations: {
              user: true,
              host: {
                members_info: true
              }
            },
            where: {
              user: { _id: req.params.uid },
              host: { _id: req.params.hid }
            }
          })
        );

        // Can't leave host as host owner
        if (userHostInfo.permissions == HostPermission.Owner) throw new ErrorHandler(HTTP.Forbidden, ErrCode.FORBIDDEN);

        await this.ORM.transaction(async txc => {
          await userHostInfo.host.removeMember(userHostInfo.user, txc);
        });
      }
    };
  }

  readUserHostInfo(): IControllerEndpoint<IUserHostInfo> {
    return {
      validators: [
        query<{ user: string }>({
          user: v => v.exists().toInt()
        })
      ],
      authStrategy: AuthStrat.isLoggedIn,
      controller: async req => {
        const uhi = await UserHostInfo.findOne({
          relations: ['host', 'user'],
          where: {
            user: {
              _id: req.query.user as string
            },
            host: {
              _id: req.params.hid
            }
          }
        });

        return uhi;
      }
    };
  }

  readOnboardingProcessStatus(): IControllerEndpoint<IHostOnboarding> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async req => {
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: req.params.hid
              }
            },
            relations: ['host', 'reviews']
          })
        );

        return onboarding.toFull();
      }
    };
  }

  readOnboardingProcessStep(): IControllerEndpoint<IOnboardingStep<any>> {
    return {
      validators: [
        parameters<{ step: number }>({
          step: v => v.exists().toInt().isIn(Object.values(HostOnboardingStep))
        })
      ],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const step = (req.params.step as unknown) as HostOnboardingStep;
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: req.params.hid
              }
            }
          })
        );

        const review = await OnboardingReview.findOne({
          relations: ['onboarding', 'reviewed_by'],
          where: {
            onboarding_version: onboarding.version,
            onboarding: {
              _id: onboarding._id
            }
          }
        });

        return {
          state: onboarding.steps[step].state,
          valid: onboarding.steps[step].valid,
          data: onboarding.steps[step].data,
          review: review && review.steps[step]
        };
      }
    };
  }

  readOnboardingSteps(): IControllerEndpoint<IOnboardingStepMap> {
    return {
      authStrategy: AuthStrat.none,
      controller: async req => {
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: req.params.hid
              }
            }
          })
        );

        const review = await OnboardingReview.findOne({
          relations: ['reviewed_by', 'onboarding'],
          where: {
            onboarding_version: onboarding.version,
            onboarding: {
              _id: onboarding._id
            }
          }
        });

        return Object.entries(onboarding.steps).reduce((acc, curr: [string, IOnboardingStep<any>]) => {
          const [step, data] = curr;
          acc[step] = {
            state: data.state,
            valid: data.valid,
            data: data.data,
            review: review && review[step]
          };

          return acc;
        }, {} as IOnboardingStepMap);
      }
    };
  }

  updateOnboardingProcessStep(): IControllerEndpoint<IOnboardingStep<unknown>> {
    return {
      validators: [
        parameters<{ step: number }>({
          step: v => v.exists().toInt().isIn(Object.values(HostOnboardingStep))
        })
      ],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        if (!req.body) throw new ErrorHandler(HTTP.DataInvalid, ErrCode.NO_DATA);
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: req.params.hid
              }
            }
          })
        );

        const user = await getCheck(User.findOne({ _id: req.session.user._id }));

        // Pick updateable fields from interface type
        const u: { [index in HostOnboardingStep]: Function } = {
          [HostOnboardingStep.ProofOfBusiness]: (d: IOnboardingProofOfBusiness) =>
            pick(d, ['business_address', 'business_contact_number', 'hmrc_company_number']),
          [HostOnboardingStep.OwnerDetails]: (d: IOnboardingOwnerDetails) => pick(d, ['owner_info']),
          [HostOnboardingStep.SocialPresence]: (d: IOnboardingSocialPresence) => pick(d, ['social_info'])
        };

        const step: HostOnboardingStep = Number.parseInt(req.params.step);

        try {
          await onboarding.updateStep(step, u[step](req.body));
        } catch (error) {
          log.error(error);
          throw new ErrorHandler(HTTP.DataInvalid, null, error);
        }

        await onboarding.setLastUpdated(user);
        await onboarding.save();
        return onboarding.steps[step];
      }
    };
  }

  submitOnboardingProcess(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const onboarding = await getCheck(
          Onboarding.findOne({
            where: {
              host: {
                _id: req.params.hid
              }
            }
          })
        );

        if (
          ![HostOnboardingState.AwaitingChanges, HostOnboardingState.HasIssues, HostOnboardingState.Modified].includes(
            onboarding.state
          )
        )
          throw new ErrorHandler(HTTP.BadRequest, ErrCode.LOCKED);

        // TODO: verify all steps filled out
        // TODO: delete all previous version step reviews
        onboarding.last_submitted = timestamp();
        onboarding.state = HostOnboardingState.PendingVerification;
        onboarding.version += 1;
        await onboarding.save();
      }
    };
  }

  readHostPerformances(): IControllerEndpoint<IEnvelopedData<IPerformanceStub[], null>> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Member),
      controller: async req => {
        return await this.ORM.createQueryBuilder(Performance, 'hps')
          .innerJoinAndSelect('hps.host', 'host')
          .where('host._id = :id', { id: req.params.hid })
          .leftJoinAndSelect('hps.stream', 'stream')
          .paginate(o => o.toStub());
      }
    };
  }

  connectStripe(): IControllerEndpoint<string> {
    return {
      authStrategy: AuthStrat.and(AuthStrat.hasHostPermission(HostPermission.Owner), AuthStrat.hostIsOnboarded()),
      controller: async req => {
        // Creating a Standard Stripe account on behalf of the host to faciliate the following:
        // https://stripe.com/img/docs/connect/direct_charges.svg
        const host = await getCheck(Host.findOne({ _id: req.params.hid }));
        if (!host.stripe_account_id) {
          // 2 Create a connected account
          // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-create-account
          const account = await this.providers.stripe.connection.accounts.create({
            // TODO: add details collected in onboarding in the .create options
            type: 'standard'
          });

          host.stripe_account_id = account.id;
          await host.save();
        }

        // 2.2 Create an account link,
        // Account Links are the means by which a Connect platform grants a connected account permission
        // to access Stripe-hosted applications, such as Connect Onboarding
        // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-create-account-link
        const link = await this.providers.stripe.connection.accountLinks.create({
          account: host.stripe_account_id,
          refresh_url: `${Env.API_URL}/stripe/refresh`,
          return_url: `${Env.API_URL}/stripe/return`,
          type: 'account_onboarding'
        });

        // Frontend then consumes this URL & re-directs the user through the Stripe onboarding
        return link.url;
      }
    };
  }

  changeAvatar(): IControllerEndpoint<IHostStub> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      preMiddlewares: [this.mws.file(2048, ['image/jpg', 'image/jpeg', 'image/png']).single('file')],
      controller: async req => {
        const host = await getCheck(
          Host.findOne({
            where: {
              _id: req.params.hid
            }
          })
        );

        host.avatar = await this.providers.s3.upload(req.file, host.avatar);
        await host.save();
        return host.toStub();
      }
    };
  }

  //router.put  <IHostS> ("/hosts/:hid/banner", Hosts.changeBanner());
  changeBanner(): IControllerEndpoint<IHostStub> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      preMiddlewares: [this.mws.file(2048, ['image/jpg', 'image/jpeg', 'image/png']).single('file')],
      controller: async req => {
        const host = await getCheck(
          Host.findOne({
            where: {
              _id: req.params.hid
            }
          })
        );

        host.banner = await this.providers.s3.upload(req.file, host.banner);
        await host.save();
        return host.toStub();
      }
    };
  }

  provisionPerformanceAccessTokens(): IControllerEndpoint<void> {
    return {
      validators: [
        body({
          email_addresses: v => v.isArray()
        })
      ],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: req.params.hid }));
        const provisioner = await getCheck(User.findOne({ _id: req.session.user._id }));
        const performance = await getCheck(
          Performance.findOne({ _id: req.params.pid }, { relations: { stream: { signing_key: true } } })
        );

        // Get a list of all users by the passed in array of e-mail addresses
        const users = (
          await Promise.allSettled(
            (req.body.email_addresses as string[]).map(email => {
              return User.findOne(
                {
                  email_address: email
                },
                {
                  select: {
                    _id: true,
                    email_address: true
                  }
                }
              );
            })
          )
        )
          .filter(r => r.status == 'fulfilled' && r.value)
          .map(p => (p as PromiseFulfilledResult<User>).value);

        // Find tokens that already exit for provided users
        // don't allow more than 1 access token / user
        const existingUserTokens = (
          await AccessToken.find({
            relations: ['user'],
            where: {
              user: { _id: In(users.map(u => u._id)) }
            },
            select: {
              user: { _id: true }
            }
          })
        ).map(t => t.user._id);

        await this.ORM.transaction(async txc => {
          // Create all the access tokens & sign them with the performances' signing key
          const tokens = users
            .filter(u => !existingUserTokens.includes(u._id))
            .map(u =>
              new AccessToken(u, performance, provisioner, TokenProvisioner.User).sign(performance.stream.signing_key)
            );

          await txc.save(tokens);

          // Push e-mails out to everyone
          users.forEach(user => Email.sendPerformanceAccessTokenProvisioned(user.email_address, performance, host));
        });
      }
    };
  }

  readStripeInfo(): IControllerEndpoint<IHostStripeInfo> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Owner),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: req.params.hid }));

        if (!host.stripe_account_id)
          return {
            is_stripe_connected: false
          };

        const stripeData = await this.providers.stripe.connection.accounts.retrieve({
          stripeAccount: host.stripe_account_id
        });

        return {
          is_stripe_connected: stripeData.charges_enabled
        };
      }
    };
  }

  readInvoices(): IControllerEndpoint<IEnvelopedData<IHostInvoice[]>> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        // TODO: support polymorphic purchaseables using concrete table inheritance
        // for all types of purchaseable items, ....that can be future me's problem
        return await this.ORM.createQueryBuilder(Invoice, 'invoice')
          .where('invoice.host__id = :host_id', { host_id: req.params.hid })
          .leftJoinAndSelect('invoice.ticket', 'ticket')
          .leftJoinAndSelect('ticket.performance', 'performance')
          .filter({
            performance_name: { subject: 'performance.name' },
            ticket_type: { subject: 'ticket.type' },
            purchased_at: { subject: 'invoice.purchased_at' },
            payment_status: { subject: 'invoice.status' },
            amount: { subject: 'invoice.amount', transformer: v => parseInt(v as string) }
          })
          .sort({
            performance_name: 'performance.name',
            amount: 'invoice.amount',
            purchased_at: 'invoice.purchased_at'
          })
          .innerJoinAndSelect("performance.stream", "stream")
          .paginate(i => i.toHostInvoice());
      }
    };
  }

  exportInvoicesToCSV(): IControllerEndpoint<void> {
    return {
      validators: [
        body({
          invoices: v => v.custom(array({ '*': v => v.isString() }))
        })
      ],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const h = await getCheck(Host.findOne({ _id: req.params.hid }));

        await Queue.enqueue({
          type: JobType.HostInvoiceCSV,
          data: {
            invoices: req.body.invoices,
            email_address: h.email_address
          }
        });
      }
    };
  }
}
