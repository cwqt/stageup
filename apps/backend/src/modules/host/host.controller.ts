import { ErrorHandler } from '@backend/common/error';
import { FinanceService } from '@backend/modules/finance/finance.service';
import {
  Blobs,
  BLOB_PROVIDER,
  EventBus,
  EVENT_BUS_PROVIDER,
  Follow,
  getCheck,
  Host,
  HostAnalytics,
  HostInvitation,
  IControllerEndpoint,
  Invoice,
  LiveStreamAsset,
  Middleware,
  ModuleController,
  Onboarding,
  OnboardingReview,
  PatronSubscription,
  Performance,
  PerformanceAnalytics,
  POSTGRES_PROVIDER,
  STRIPE_PROVIDER,
  User,
  UserHostInfo,
  Validators
} from '@core/api';
import { timestamp } from '@core/helpers';
import {
  Analytics,
  AnalyticsTimePeriod,
  AnalyticsTimePeriods,
  AssetType,
  DtoHostAnalytics,
  DtoHostPatronageSubscription,
  DtoPerformanceAnalytics,
  DtoUpdateHost,
  hasRequiredHostPermission,
  HostInviteState,
  HostOnboardingState,
  HostOnboardingStep,
  HostPermission,
  HTTP,
  IDeleteHostAssertion,
  IDeleteHostReason,
  IEnvelopedData,
  IFollower,
  IHost,
  IHostFeed,
  IHostInvoice,
  IHostInvoiceStub,
  IHostMemberChangeRequest,
  IHostOnboarding,
  IHostPrivate,
  IHostStripeInfo,
  IOnboardingStep,
  IOnboardingStepMap,
  IPerformanceStub,
  IRefund,
  IUserFollow,
  IUserHostInfo,
  LiveStreamState,
  IFeedPerformanceStub,
  Visibility
} from '@core/interfaces';
import Stripe from 'stripe';
import { array, assign, boolean, coerce, enums, object, string, StructError, record, optional } from 'superstruct';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';
import AuthStrat from '../../common/authorisation';
import IdFinderStrat from '../../common/authorisation/id-finder-strategies';
import Env from '../../env';

@Service()
export class HostController extends ModuleController {
  constructor(
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(BLOB_PROVIDER) private blobs: Blobs,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    private financeService: FinanceService
  ) {
    super();
  }

  createHost: IControllerEndpoint<IHost> = {
    validators: { body: Validators.Objects.DtoCreateHost },
    authorisation: AuthStrat.runner(
      { uid: IdFinderStrat.findUserIdFromSession },
      AuthStrat.userEmailIsVerified(m => m.uid)
    ),
    controller: async req => {
      // Make sure user is not already part of a host
      const user = await User.findOne({ _id: req.session.user._id }, { relations: ['host'] });
      if (user.host) throw new ErrorHandler(HTTP.Conflict, '@@error.duplicate');

      // Check if the username for a host is already taken
      const h = await Host.findOne({ username: req.body.username });
      if (h) throw new ErrorHandler(HTTP.Conflict, '@@error.in_use');

      // Create host & add current user (creator) to it through transaction
      // & begin the onboarding process by running .setup()
      const host = await this.ORM.transaction(async txc => {
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

        return await txc.save(host);
      });

      await this.bus.publish('host.created', { host_id: host._id }, req.locale);
      return host.toFull();
    }
  };

  readHost: IControllerEndpoint<IEnvelopedData<IHost, IUserFollow>> = {
    authorisation: AuthStrat.none,
    controller: async req => {
      const host = await Host.findOne(
        req.params.hid[0] == '@' ? { username: req.params.hid.slice(1) } : { _id: req.params.hid },
        {
          relations: {
            members_info: {
              user: true
            }
          }
        }
      );

      // if req.session.user._id && userHasFollow then envelope.__client_data.is_following = true
      const isFollowing =
        req.session.user &&
        (await this.ORM.createQueryBuilder(Follow, 'follow')
          .where('follow.user__id = :uid', { uid: req.session.user._id })
          .andWhere('follow.host__id = :hid', { hid: host._id })
          .getOne());

      const envelope = {
        data: host.toFull(),
        __client_data: { is_following: isFollowing ? true : false }
      };
      return envelope;
    }
  };

  updateHost: IControllerEndpoint<IHostPrivate> = {
    validators: { body: Validators.Objects.DtoUpdateHost },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      let host = await getCheck(Host.findOne({ _id: req.params.hid }));

      // already validated entire body is there
      const dto: DtoUpdateHost = req.body;
      host.business_details = {
        hmrc_company_number: dto.business_details.hmrc_company_number,
        business_contact_number: dto.business_details.business_contact_number,
        vat_number: dto.business_details.vat_number,
        business_type: dto.business_details.business_type,
        business_address: {
          city: dto.business_details.business_address.city,
          country: dto.business_details.business_address.country,
          line1: dto.business_details.business_address.line1,
          postal_code: dto.business_details.business_address.postal_code,
          line2: dto.business_details.business_address.line2 || null,
          state: dto.business_details.business_address.state || null
        }
      };

      host.social_info = {
        site_url: dto.social_info.site_url,
        facebook_url: dto.social_info.facebook_url,
        instagram_url: dto.social_info.instagram_url,
        twitter_url: dto.social_info.twitter_url,
        pinterest_url: dto.social_info.pinterest_url,
        linkedin_url: dto.social_info.linkedin_url,
        youtube_url: dto.social_info.youtube_url
      };

      host.email_address = dto.email_address;
      host.name = dto.name;
      host.username = dto.username;
      host.social_info = dto.social_info;
      host.bio = dto.bio;

      return (await host.save()).toPrivate();
    }
  };

  readMembers: IControllerEndpoint<IEnvelopedData<IUserHostInfo[], null>> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      return await this.ORM.createQueryBuilder(UserHostInfo, 'uhi')
        .where('uhi.host__id = :host_id', { host_id: req.params.hid })
        .innerJoinAndSelect('uhi.user', 'user')
        .paginate({ serialiser: uhi => uhi.toFull() });
    }
  };

  deleteHost: IControllerEndpoint<IDeleteHostAssertion | void> = {
    // We can choose to assert only - i.e. check that it's possible to delete
    validators: { query: object({ assert_only: coerce(boolean(), string(), v => v == 'true') }) },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Owner),
    controller: async req => {
      const host = await getCheck(
        Host.findOne({
          where: { _id: req.params.hid },
          relations: { performances: true },
          select: { performances: true, _id: true, locale: true }
        })
      );

      // First assert the following before being able to delete:
      //  * There are no currently live performances
      const duePerformances = host.performances.filter(p => p.premiere_datetime && p.premiere_datetime > timestamp());

      //  * There are no performances that are due to be premiered in the future
      const presentlyLivePerformances = host.performances.filter(p =>
        p.asset_group.assets.some(
          a => a.type == AssetType.LiveStream && (a as LiveStreamAsset).meta.state == LiveStreamState.Active
        )
      );

      // Validator coerces this value to a boolean :)
      if (req.query.assert_only) {
        // If any of the above checks have more than one performance in them, then they need to deal with it
        return {
          can_delete: ![duePerformances, presentlyLivePerformances].some(arr => arr.length > 0),
          due_performances: duePerformances.map(p => p.toStub()),
          live_performances: presentlyLivePerformances.map(p => p.toStub())
        };
      } else {
        // Expecting a DtoDeleteHostReason with the req.body, so validate it
        const [error] = Validators.Objects.IDeleteHostReason.validate(req.body);
        if (error) throw new ErrorHandler(HTTP.BadRequest, '@@validation.invalid', Validators.formatError(error));

        // Set the reason for leaving & soft delete the entity
        const reason: IDeleteHostReason = req.body;
        host.delete_reason = reason;
        await host.save();

        // Transactionally softRemoves everything associated with this host account
        await host.softRemove();
        await this.bus.publish('host.deleted', { host_id: host._id }, host.locale);
      }
    }
  };

  readDetails: IControllerEndpoint<IHostPrivate> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Member),
    controller: async req => {
      const host = await getCheck(Host.findOne({ _id: req.params.hid }));

      return host.toPrivate();
    }
  };

  //router.post<IUserHostInfo>("/hosts/:hid/members", Hosts.addMember());
  addMember: IControllerEndpoint<IUserHostInfo> = {
    validators: { body: Validators.Objects.IHostMemberChangeRequest },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      const changeRequest: IHostMemberChangeRequest = req.body;

      // Check invited user not already part of a host in any capacity
      const invitee = await getCheck(
        User.findOne({ email_address: changeRequest.value as string }, { relations: ['host'] })
      );
      if (invitee.host) throw new ErrorHandler(HTTP.Conflict, '@@error.duplicate');

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
        throw new ErrorHandler(HTTP.Conflict, '@@error.duplicate');

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
      const invite = await this.ORM.transaction(async txc => {
        await host.addMember(invitee, HostPermission.Pending, txc);
        await txc.save(host);

        const invite = new HostInvitation(inviter, invitee, host);
        return await txc.save(invite);
      });

      this.bus.publish(
        'user.invited_to_host',
        {
          invite_id: invite._id,
          host_id: host._id,
          invitee_id: invitee._id,
          inviter_id: inviter._id
        },
        req.locale
      );

      // Return newly added user UserHostInfo
      return host.members_info.find(uhi => uhi.user?.email_address == changeRequest.value).toFull();
    }
  };

  handleHostInvite: IControllerEndpoint<string> = {
    authorisation: AuthStrat.hasSpecificHostPermission(HostPermission.Pending),
    controller: async req => {
      const invite = await getCheck(
        HostInvitation.findOne({ _id: req.params.iid }, { relations: ['invitee'], select: { invitee: { _id: true } } })
      );

      // Only accept the request if the logged in user matches the invites' user
      if (invite.invitee._id !== req.session.user._id) throw new ErrorHandler(HTTP.BadRequest, '@@error.invalid');

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
        invite.state = HostInviteState.Expired;
        await invite.save();
        return `${Env.FRONTEND.URL}/${req.locale.language}?invite_state=${HostInviteState.Expired}`;
      }

      // Otherwise accept the user into the host
      await this.ORM.transaction(async txc => {
        invite.state = HostInviteState.Accepted;
        uhi.permissions = HostPermission.Member;

        await Promise.all([txc.save(invite), txc.save(uhi)]);
      });

      return `${Env.FRONTEND.URL}/${req.locale.language}?invite_accepted=${HostInviteState.Accepted}`;
    }
  };

  // router.put <IHost> ("/hosts/:hid/members/:mid", Hosts.updateMember());
  updateMember: IControllerEndpoint<void> = {
    validators: { body: Validators.Objects.IHostMemberChangeRequest },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
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
        throw new ErrorHandler(HTTP.Forbidden, '@@error.not_member');

      // Don't allow updating to Owner as that is a transfer of host ownership
      const newUserPermission: HostPermission = req.body.value;
      if (newUserPermission == HostPermission.Owner) throw new ErrorHandler(HTTP.Unauthorised);

      // Don't allow admins to demote an Owner
      if (userHostInfo.permissions == HostPermission.Owner)
        throw new ErrorHandler(HTTP.Unauthorised, '@@error.missing_permissions');

      userHostInfo.permissions = newUserPermission;
      await userHostInfo.save();
    }
  };

  // router.delete <void>("/hosts/:hid/members/:uid", Hosts.removeMember());
  removeMember: IControllerEndpoint<void> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
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
      if (userHostInfo.permissions == HostPermission.Owner) throw new ErrorHandler(HTTP.Forbidden, '@@error.forbidden');

      await this.ORM.transaction(async txc => {
        await userHostInfo.host.removeMember(userHostInfo.user, txc);
      });
    }
  };

  readOnboardingProcessStatus: IControllerEndpoint<IHostOnboarding> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Owner),
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

  readOnboardingProcessStep: IControllerEndpoint<IOnboardingStep<any>> = {
    validators: { params: object({ step: enums(Object.values(HostOnboardingStep)), hid: string() }) },
    authorisation: AuthStrat.none,
    controller: async req => {
      const step = req.params.step as HostOnboardingStep;
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

  readOnboardingSteps: IControllerEndpoint<IOnboardingStepMap> = {
    authorisation: AuthStrat.none,
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

  updateOnboardingProcessStep: IControllerEndpoint<IOnboardingStep<unknown>> = {
    validators: { params: object({ step: enums(Object.values(HostOnboardingStep)), hid: string() }) },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      if (!req.body) throw new ErrorHandler(HTTP.DataInvalid, '@@error.missing_body');
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
      const step = req.params.step as HostOnboardingStep;

      try {
        await onboarding.updateStep(step, req.body);
      } catch (error) {
        if (error instanceof StructError) {
          throw new ErrorHandler(HTTP.DataInvalid, null, Validators.formatError(error));
        } else {
          throw error;
        }
      }

      await onboarding.setLastUpdated(user);
      await onboarding.save();
      return onboarding.steps[step];
    }
  };

  submitOnboardingProcess: IControllerEndpoint<void> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
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
        throw new ErrorHandler(HTTP.BadRequest, '@@error.locked');

      // Verifies all steps are atleast valid
      if (Object.values(onboarding.steps).some((step: IOnboardingStep) => step.valid == false)) {
        // If not, then return an array listing all invalid steps to the client
        throw new ErrorHandler(
          HTTP.BadRequest,
          '@@onboarding.steps_invalid',
          Object.keys(onboarding.steps)
            .filter(step => onboarding.steps[step].valid == false)
            .map(step => ({
              path: step,
              code: '@@onboarding.step_is_invalid'
            }))
        );
      }

      onboarding.last_submitted = timestamp();
      onboarding.state = HostOnboardingState.PendingVerification;
      onboarding.version += 1;
      await onboarding.save();
    }
  };

  readHostPerformances: IControllerEndpoint<IEnvelopedData<IPerformanceStub[], null>> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Member),
    controller: async req => {
      return await this.ORM.createQueryBuilder(Performance, 'performance')
        .innerJoinAndSelect('performance.host', 'host')
        .where('host._id = :id', { id: req.params.hid })
        .orderBy('performance.created_at', 'DESC')
        .withDeleted() //Return deleted performances so they appear in the table but with PerformanceStatus.Deleted
        .paginate({ serialiser: o => o.toStub() });
    }
  };

  readHostFeedPerformances: IControllerEndpoint<IHostFeed> = {
    validators: {
      query: record(
        enums<keyof IHostFeed>(['upcoming']),
        Validators.Objects.PaginationOptions(10)
      ),
      params: object({ hid: optional(Validators.Fields.nuuid) })
    },

    authorisation: AuthStrat.none,
    controller: async req => {
      const hostFeed: IHostFeed = {
        upcoming: null
      };

      hostFeed.upcoming = await this.ORM.createQueryBuilder(Performance, 'p')
        .where('host._id = :id', { id: req.params.hid })
        .andWhere('p.premiere_datetime > :currentTime', { currentTime: timestamp() })
        .andWhere('p.visibility = :state', { state: Visibility.Public })
        .innerJoinAndSelect('p.host', 'host')
        .orderBy('p.premiere_datetime')
        .leftJoinAndSelect('p.likes', 'likes', 'likes.user__id = :uid', { uid: req.session.user?._id })
        .paginate({
          serialiser: p => p.toClientStub(),
          page: req.query.upcoming ? parseInt((req.query.upcoming as any).page) : 0,
          per_page: req.query.upcoming ? parseInt((req.query.upcoming as any).per_page) : 4
        });

        return hostFeed;
    }
  };

  connectStripe: IControllerEndpoint<string> = {
    authorisation: AuthStrat.and(AuthStrat.hasHostPermission(HostPermission.Owner), AuthStrat.hostIsOnboarded()),
    controller: async req => {
      // Creating a Standard Stripe account on behalf of the host to faciliate the following:
      // https://stripe.com/img/docs/connect/direct_charges.svg
      const host = await getCheck(Host.findOne({ _id: req.params.hid }, { relations: { owner: true } }));

      if (!host.stripe_account_id) {
        // 2 Create a connected account
        // https://stripe.com/docs/connect/enable-payment-acceptance-guide#web-create-account
        const account = await this.stripe.accounts.create({
          type: 'standard',
          email: host.email_address,
          country: host.business_details.business_address.country,
          business_type: host.business_details.business_type, // FUTURE https://alacrityfoundationteam31.atlassian.net/browse/SU-892
          business_profile: {
            name: host.username,
            url: host.social_info.site_url
          },
          company: {
            name: host.name,
            phone: host.business_details.business_contact_number,
            address: host.business_details.business_address
          }
        });

        host.stripe_account_id = account.id;
        await host.save();
      }

      // Complete OAuth Flow to connect the account - use OAuth instead of AccountLinks to allow
      // use to skip this form in development
      // https://stripe.com/docs/building-extensions
      const link = this.stripe.oauth.authorizeUrl({
        redirect_uri: `${Env.BACKEND.URL}/stripe/oauth`,
        client_id: Env.STRIPE.CLIENT_ID,
        response_type: 'code'
      });

      return link;
    }
  };

  changeAvatar: IControllerEndpoint<string> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    middleware: Middleware.file(2048, ['image/jpg', 'image/jpeg', 'image/png']).single('file'),
    controller: async req => {
      const host = await getCheck(
        Host.findOne({
          where: {
            _id: req.params.hid
          }
        })
      );

      host.avatar = (await this.blobs.upload(req.file, host.avatar)).location;
      await host.save();
      return host.avatar;
    }
  };

  //router.put  <string> ("/hosts/:hid/banner", Hosts.changeBanner());
  changeBanner: IControllerEndpoint<string> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    middleware: Middleware.file(2048, ['image/jpg', 'image/jpeg', 'image/png']).single('file'),
    controller: async req => {
      const host = await getCheck(
        Host.findOne({
          where: {
            _id: req.params.hid
          }
        })
      );

      host.banner = (await this.blobs.upload(req.file, host.banner)).location;
      await host.save();
      return host.banner;
    }
  };

  // FIXME: This is now a whole lot more awkward with Claims, you can't provision a token that will
  // give permissions in perpetuity for every signed asset on a performance
  // A possible solution is to create one for every asset existing at the point of it's creation
  // and then for every asset added / deleted, updating the claim to reflect the changes
  // See: https://alacrityfoundationteam31.atlassian.net/browse/SU-883
  // provisionPerformanceAccessTokens: IControllerEndpoint<void> = {
  //     validators: { body: object({ email_addresses: array(Validators.Fields.email) }) },
  //     authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
  //     controller: async req => {
  //       const host = await getCheck(Host.findOne({ _id: req.params.hid }));
  //       const provisioner = await getCheck(User.findOne({ _id: req.session.user._id }));
  //       const performance = await getCheck(Performance.findOne({ _id: req.params.pid }));

  //       // Get a list of all users by the passed in array of e-mail addresses
  //       const users = (
  //         await Promise.allSettled(
  //           (req.body.email_addresses as string[]).map(email => {
  //             return User.findOne(
  //               {
  //                 email_address: email
  //               },
  //               {
  //                 select: {
  //                   _id: true,
  //                   email_address: true
  //                 }
  //               }
  //             );
  //           })
  //         )
  //       )
  //         .filter(r => r.status == 'fulfilled' && r.value)
  //         .map(p => (p as PromiseFulfilledResult<User>).value);

  //       // Find tokens that already exit for provided users & don't allow more than 1 access token / user
  //       const existingUserTokens = (
  //         await AccessToken.find({
  //           relations: ['user'],
  //           where: {
  //             user: { _id: In(users.map(u => u._id)) }
  //           },
  //           select: {
  //             user: { _id: true }
  //           }
  //         })
  //       ).map(t => t.user._id);

  //       await this.ORM.transaction(async txc => {

  //         // Create all the access tokens & sign them with the performances' signing key
  //         const tokens = users
  //           .filter(u => !existingUserTokens.includes(u._id))
  //           .map(
  //             u => {

  //               const token = new AccessToken(u);

  //             }
  //           );

  //         await txc.save(tokens);

  //         // Push e-mails out to everyone
  //         users.forEach(user => {
  //           this.providers.bus.publish(
  //             'user.invited_to_private_showing',
  //             {
  //               performance_id: performance._id,
  //               host_id: host._id,
  //               user_id: user._id
  //             },
  //             user.locale
  //           );
  //         });
  //       });
  //     }
  //   };
  // }

  readStripeInfo: IControllerEndpoint<IHostStripeInfo> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Owner),
    controller: async req => {
      const host = await getCheck(Host.findOne({ _id: req.params.hid }));

      if (!host.stripe_account_id)
        return {
          is_stripe_connected: false
        };

      const stripeData = await this.stripe.accounts.retrieve({
        stripeAccount: host.stripe_account_id
      });

      return {
        is_stripe_connected: stripeData.charges_enabled
      };
    }
  };

  readInvoice: IControllerEndpoint<IHostInvoice> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      const invoice = await this.ORM.createQueryBuilder(Invoice, 'invoice')
        .where('invoice._id = :invoice_id', { invoice_id: req.params.iid })
        .innerJoinAndSelect('invoice.ticket', 'ticket')
        .innerJoinAndSelect('ticket.performance', 'performance')
        .innerJoinAndSelect('performance.host', 'host')
        .innerJoinAndSelect('performance.asset_group', 'group')
        .innerJoinAndSelect('group.assets', 'assets')
        .innerJoinAndSelect('invoice.user', 'user')
        .withDeleted()
        .getOne();

      const intent = await this.stripe.paymentIntents.retrieve(
        invoice.stripe_payment_intent_id,
        { expand: ['payment_method'] },
        {
          stripeAccount: invoice.ticket.performance.host.stripe_account_id
        }
      );

      return invoice.toHostInvoice(intent);
    }
  };

  readInvoices: IControllerEndpoint<IEnvelopedData<IHostInvoiceStub[]>> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      return await this.ORM.createQueryBuilder(Invoice, 'invoice')
        .where('invoice.host__id = :host_id', { host_id: req.params.hid })
        .leftJoinAndSelect('invoice.ticket', 'ticket')
        .leftJoinAndSelect('ticket.performance', 'performance')
        .filter({
          invoice_id: { subject: 'invoice._id' },
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
        .innerJoinAndSelect('performance.asset_group', 'group')
        .innerJoinAndSelect('group.assets', 'assets')
        .withDeleted() // tickets & performances & patronages can be soft deleted
        .paginate({ serialiser: i => i.toHostInvoiceStub() });
    }
  };

  readInvoiceRefunds: IControllerEndpoint<IRefund[]> = {
    authorisation: AuthStrat.none,
    controller: async req => {
      const { refunds } = await getCheck(Invoice.findOne({ _id: req.params.iid }, { relations: ['refunds'] }));
      return refunds.map(r => r.toFull());
    }
  };

  processRefunds: IControllerEndpoint<void> = {
    validators: {
      body: Validators.Objects.IProcessRefunds
    },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      await this.financeService.processRefunds(
        {
          host_id: req.params.hid,
          invoice_ids: req.body.invoice_ids,
          bulk_refund_data: {
            bulk_refund_reason: req.body.bulk_refund_reason,
            bulk_refund_detail: req.body.bulk_refund_detail
          }
        },
        req.locale
      );
    }
  };

  exportInvoicesToCSV: IControllerEndpoint<void> = {
    validators: { body: object({ invoices: array(Validators.Fields.nuuid) }) },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      const h = await getCheck(Host.findOne({ _id: req.params.hid }));
      await this.bus.publish(
        'host.invoice_export',
        { format: 'csv', invoice_ids: req.body.invoices, email_address: h.email_address },
        req.locale
      );
    }
  };

  //router.post <void>  ("/hosts/:hid/invoices/export-pdf", Hosts.exportInvoicesToPDF());
  exportInvoicesToPDF: IControllerEndpoint<void> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      const h = await getCheck(Host.findOne({ _id: req.params.hid }));
      await this.bus.publish(
        'host.invoice_export',
        { format: 'pdf', invoice_ids: req.body.invoices, email_address: h.email_address },
        req.locale
      );
    }
  };

  readPatronageSubscribers: IControllerEndpoint<IEnvelopedData<DtoHostPatronageSubscription[]>> = {
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      return await this.ORM.createQueryBuilder(PatronSubscription, 'sub')
        .where('sub.host__id = :host_id', { host_id: req.params.hid })
        .leftJoinAndSelect('sub.patron_tier', 'tier')
        .leftJoinAndSelect('sub.last_invoice', 'invoice')
        .leftJoinAndSelect('invoice.user', 'user')
        .filter({
          sub_id: { subject: 'sub._id' },
          sub_status: { subject: 'sub.status' },
          user_username: { subject: 'user.username' },
          tier_name: { subject: 'tier.name' },
          patron_created: { subject: 'sub.created_at' },
          invoice_amount: { subject: 'invoice.amount', transformer: v => parseInt(v as string) }
        })
        .sort({
          invoice_amount: 'invoice.amount',
          patron_created: 'sub.created_at'
        })
        .withDeleted() // tickets & performances & patronages can be soft deleted
        .paginate({ serialiser: sub => sub.toDtoHostPatronageSubscription() });
    }
  };

  readHostFollowers: IControllerEndpoint<IEnvelopedData<IFollower[]>> = {
    validators: { params: object({ hid: string() }) },
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      return await this.ORM.createQueryBuilder(Follow, 'follow')
        .where('follow.host__id = :hid', { hid: req.params.hid })
        .paginate({ serialiser: follow => follow.toFollower() });
    }
  };

  readHostAnalytics: IControllerEndpoint<DtoHostAnalytics> = {
    validators: {
      query: object({ period: enums<AnalyticsTimePeriod>(AnalyticsTimePeriods) })
    },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      const host = await getCheck(Host.findOne({ _id: req.params.hid }));

      // Get all the recorded analytics chunks for this host
      const chunks = await this.ORM.createQueryBuilder(HostAnalytics, 'host_analytics')
        .where('host_analytics.host__id = :id', { id: req.params.hid })
        .orderBy('host_analytics.period_ended_at', 'DESC')
        .limit(Analytics.offsets[req.query.period as AnalyticsTimePeriod] * 2)
        .getMany();

      // Only a single host, this one!
      return {
        ...host.toStub(),
        chunks: chunks.map(chunk => chunk.toDto())
      };
    }
  };

  readPerformancesAnalytics: IControllerEndpoint<IEnvelopedData<DtoPerformanceAnalytics[]>> = {
    validators: {
      query: assign(
        object({ period: enums<AnalyticsTimePeriod>(AnalyticsTimePeriods) }),
        Validators.Objects.PaginationOptions(10)
      )
    },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      // Get paginated list of performances, will then append analytics onto the stubs for DtoPerformanceAnalytics type
      const performances = await this.ORM.createQueryBuilder(Performance, 'performance')
        .innerJoinAndSelect('performance.host', 'host')
        .where('host._id = :id', { id: req.params.hid })
        .orderBy('performance.created_at', 'DESC')
        .paginate({ serialiser: o => o.toStub() });

      const dtos: DtoPerformanceAnalytics[] = [];
      for await (let performance of performances.data) {
        // Get weekly aggregations sorted by period_end (when collected)
        const chunks = await this.ORM.createQueryBuilder(PerformanceAnalytics, 'analytics')
          .where('analytics.performance__id = :performanceId', { performanceId: performance._id })
          .orderBy('analytics.period_ended_at', 'DESC')
          // Get twice the selected period, so we can do a comparison of latest & previous periods for trends
          .limit(Analytics.offsets[req.query.period as AnalyticsTimePeriod] * 2)
          .getMany();

        dtos.push({
          ...performance,
          chunks: chunks.map(chunk => chunk.toDto())
        });
      }

      return { data: dtos, __paging_data: performances.__paging_data };
    }
  };
}
