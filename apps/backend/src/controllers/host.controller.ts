import {
  ErrCode,
  HostOnboardingStep,
  HostPermission,
  IHost,
  IHostOnboarding,
  HostOnboardingState,
  IHostPrivate,
  IOnboardingAddMembers,
  IOnboardingOwnerDetails,
  IOnboardingProofOfBusiness,
  IOnboardingSocialPresence,
  IOnboardingStep,
  IOnboardingSubscriptionConfiguration,
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
  hasRequiredHostPermission
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
  S3Return
} from '@core/shared/api';

import { timestamp } from '@core/shared/helpers';

import Env from '../env';
import Email = require('../common/email');
import IdFinderStrat from '../common/authorisation/id-finder-strategies';
import AuthStrat from '../common/authorisation';
import { log } from '../common/logger';
import { In } from 'typeorm';
import { BackendDataClient } from '../common/data';
import S3Provider from 'libs/shared/src/api/providers/aws-s3.provider';

export default class HostController extends BaseController<BackendDataClient> {
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
              user: { _id: req.params.mid },
              host: { _id: req.params.hid }
            }
          })
        );

        // Don't be able to force increase permissions if the user hasn't accepted the invitation
        if(hasRequiredHostPermission(userHostInfo.permissions, HostPermission.Member))
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

  // router.delete <void>("/hosts/:hid/members/:mid", Hosts.removeMember());
  removeMember(): IControllerEndpoint<void> {
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const userHostInfo = await getCheck(
          UserHostInfo.findOne({
            relations: ['user', 'host'],
            where: {
              user: { _id: req.params.mid },
              host: { _id: req.params.hid }
            }
          })
        );

        if (userHostInfo.permissions == HostPermission.Owner)
          throw new ErrorHandler(HTTP.Unauthorised, ErrCode.MISSING_PERMS);
        await userHostInfo.remove();
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

        if (![HostOnboardingState.AwaitingChanges, HostOnboardingState.HasIssues].includes(onboarding.state))
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
      authStrategy: AuthStrat.none,
      controller: async req => {
        const hostPerformances = await this.ORM.createQueryBuilder(Performance, 'hps')
          .innerJoinAndSelect('hps.host', 'host')
          .where('host._id = :id', { id: req.params.hid })
          .paginate();
        return {
          data: hostPerformances.data.map(o => o.toStub()),
          __paging_data: hostPerformances.__paging_data
        };
      }
    };
  }

  changeAvatar(): IControllerEndpoint<IHostStub>{
    return {
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin), 
      preMiddlewares: [this.mws.file(2048, ["image/jpg", "image/jpeg", "image/png"]).single("file")],
      controller: async (req, dc) => {
        const s3Provider:S3Provider = dc.providers["s3"];
        const host = await getCheck(Host.findOne(
          {
            where: {
              
              _id: req.params.hid
            }
          }
        ));

        // Check whether an image already exists for this host first
        // Delete if so to save space on s3
        if (host.avatar) await s3Provider.deleteImageFromS3(host.avatar);
        
        const dataFromS3: S3Return = await s3Provider.uploadImagetoS3(req.file);
        
        host.avatar = dataFromS3.Location;
           
        await host.save();
        return host.toStub();
      },
    }
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
          Performance.findOne({ _id: req.params.pid }, { relations: { host_info: { signing_key: true } } })
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
              new AccessToken(u, performance, provisioner, TokenProvisioner.User).sign(
                performance.host_info.signing_key
              )
            );

          await txc.save(tokens);

          // Push e-mails out to everyone
          users.forEach(user => Email.sendPerformanceAccessTokenProvisioned(user.email_address, performance, host));
        });
      }
    };
  }

  // updateHost(): IControllerEndpoint<IHost> {
  //   return {
  //     validators: [],
  //     authStrategy: AuthStrat.none,
  //     controller: async req => {
  //       return ({} as IHost);
  //     }
  //   };
  // }
}