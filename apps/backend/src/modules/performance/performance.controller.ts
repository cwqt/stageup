import { ErrorHandler } from '@backend/common/error';
import {
  AccessToken,
  AppCache,
  Asset,
  AssetGroup,
  AssetView,
  Blobs,
  BLOB_PROVIDER,
  EventBus,
  EVENT_BUS_PROVIDER,
  Follow,
  getCheck,
  Host,
  IControllerEndpoint,
  ImageAsset,
  Invoice,
  Like,
  LiveStreamAsset,
  Middleware,
  ModuleController,
  MUX_PROVIDER,
  PaymentMethod,
  Performance,
  POSTGRES_PROVIDER,
  Provider,
  Rating,
  REDIS_PROVIDER,
  SignableAssetType,
  SigningKey,
  STRIPE_PROVIDER,
  Ticket,
  transact,
  User,
  UserHostMarketingConsent,
  UserStageUpMarketingConsent,
  Validators,
  VideoAsset
} from '@core/api';
import { enumToValues, getDonoAmount, timestamp, to } from '@core/helpers';
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  AssetDto,
  AssetOwnerType,
  AssetTag,
  AssetTags,
  AssetType,
  BASE_AMOUNT_MAP,
  ConsentOpt,
  DtoCreateAsset,
  DtoCreatePaymentIntent,
  DtoPerformance,
  HostPermission,
  HTTP,
  ICreateAssetRes,
  IEnvelopedData,
  IPaymentIntentClientSecret,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  ISignedToken,
  IStripeChargePassthrough,
  ITicket,
  ITicketStub,
  LikeLocation,
  NUUID,
  pick,
  PurchaseableType,
  PlatformConsentOpt,
  TicketType,
  Visibility,
  PerformanceStatus,
  PerformanceType
} from '@core/interfaces';
import Mux from '@mux/mux-node';
import { RedisClient } from 'redis';
import Stripe from 'stripe';
import { array, boolean, enums, object, optional } from 'superstruct';
import { Inject, Service } from 'typedi';
import { Connection, In, Not } from 'typeorm';
import AuthStrat from '../../common/authorisation';
import { default as IdFinderStrat } from '../../common/authorisation/id-finder-strategies';
import Env from '../../env';
import { PerformanceService } from './performance.service';
import { GdprService } from '../gdpr/gdpr.service';
import { UserService } from '../user/user.service';

@Service()
export class PerformanceController extends ModuleController {
  constructor(
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(MUX_PROVIDER) private mux: Mux,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe,
    @Inject(EVENT_BUS_PROVIDER) private bus: EventBus,
    @Inject(REDIS_PROVIDER) private redis: AppCache,
    @Inject(BLOB_PROVIDER) private blobs: Blobs,
    private gdprService: GdprService,
    private performanceService: PerformanceService,
    private userService: UserService
  ) {
    super();
  }

  // router.post <IPerf> ("/hosts/:hid/performances", Perfs.createPerformance());
  createPerformance: IControllerEndpoint<IPerformance> = {
    validators: { body: object({ type: enums(enumToValues(PerformanceType) as PerformanceType[]) }) },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
    controller: async req => {
      const host = await getCheck(Host.findOne({ _id: req.params.hid }));

      return await transact(async txc => {
        const performance = await new Performance(req.body.type, host).save();
        await performance.setup(txc);

        // Temporary single asset per performance; either vod or stream, at-least
        // until multi-assets stories are completed
        if (req.body.type == 'vod') {
          const asset = new VideoAsset(performance.asset_group, ['primary']);
          await asset.setup(
            this.mux,
            {
              cors_origin: Env.FRONTEND.URL,
              new_asset_settings: {
                playback_policy: 'signed'
              }
            },
            {
              asset_owner_type: AssetOwnerType.Performance,
              asset_owner_id: performance._id
            },
            txc
          );
          performance.asset_group.assets.push(asset);
          await txc.save(asset);
        }

        if (req.body.type == 'live') {
          const asset = new LiveStreamAsset(performance.asset_group, ['primary']);
          await asset.setup(
            this.mux,
            null,
            {
              asset_owner_type: AssetOwnerType.Performance,
              asset_owner_id: performance._id
            },
            txc
          );
          performance.asset_group.assets.push(asset);
          await txc.save(asset);
        }

        const p = performance.toFull();
        this.bus.publish('performance.created', p, req.locale);
        return p;
      });
    }
  };

  //router.get <IE<IPerfS[], null>> ("/performances", Perfs.readPerformances());
  readPerformances: IControllerEndpoint<IEnvelopedData<IPerformanceStub[]>> = {
    authorisation: AuthStrat.none,
    controller: async req => {
      return await this.ORM.createQueryBuilder(Performance, 'p')
        .innerJoinAndSelect('p.host', 'host')
        .andWhere('p.visibility = :state', { state: Visibility.Public })
        .filter({
          genre: { subject: 'p.genre' }
        })
        .paginate({ serialiser: p => p.toStub() });
    }
  };

  readPerformance: IControllerEndpoint<DtoPerformance> = {
    authorisation: AuthStrat.none,
    controller: async req => {
      const whereQuery = { _id: req.params.pid };
      // If 'include_deleted' is not passed as a query param we will filter out any deleted performances
      if (!req.query.include_deleted) whereQuery['status'] = Not(PerformanceStatus.Deleted);
      const performance = await getCheck(
        Performance.findOne({
          where: whereQuery,
          relations: {
            host: true,
            tickets: true,
            asset_group: true
          }
        })
      );

      const currentTime = timestamp();
      performance.tickets = performance.tickets.filter(
        t => t.is_visible && t.start_datetime < currentTime && currentTime < t.end_datetime
      );

      const existingLike =
        req.session.user &&
        (await this.ORM.createQueryBuilder(Like, 'like')
          .where('like.user__id = :uid', { uid: req.session.user._id })
          .andWhere('like.performance__id = :pid', { pid: performance._id })
          .getOne());

      const existingFollow =
        req.session.user &&
        (await this.ORM.createQueryBuilder(Follow, 'follow')
          .where('follow.user__id = :uid', { uid: req.session.user._id })
          .andWhere('follow.host__id = :hid', { hid: performance.host._id })
          .getOne());

      const existingRating =
        req.session.user &&
        (await this.ORM.createQueryBuilder(Rating, 'rating')
          .where('rating.user__id = :uid', { uid: req.session.user._id })
          .andWhere('rating.performance__id = :pid', { pid: performance._id })
          .getOne());

      const hostMarketingStatus =
        req.session.user &&
        (await this.ORM.createQueryBuilder(UserHostMarketingConsent, 'c')
          .where('c.host__id = :hid', { hid: performance.host._id })
          .andWhere('c.user__id = :uid', { uid: req.session.user._id })
          .getOne());

      const platformMarketingStatus =
        req.session.user && (await this.gdprService.readUserPlatformConsent(req.session.user._id));

      const invoice =
        req.session.user && (await this.performanceService.readUserInvoice(performance._id, req.session.user._id));

      const response: DtoPerformance = {
        data: performance.toFull(),
        __client_data: {
          is_liking: existingLike ? true : false,
          is_following: existingFollow ? true : false,
          rating: existingRating ? existingRating.rating : null,
          host_marketing_opt_status: hostMarketingStatus ? (hostMarketingStatus.opt_status as ConsentOpt) : null,
          platform_marketing_opt_status: platformMarketingStatus
            ? (platformMarketingStatus.opt_status as PlatformConsentOpt)
            : null,
          has_bought_ticket_for: invoice ? true : false
        }
      };

      return response;
    }
  };

  readPerformanceHostInfo: IControllerEndpoint<IPerformanceHostInfo> = {
    authorisation: AuthStrat.none,
    controller: async req => {
      const performance = await Performance.findOne({ _id: req.params.pid });

      // FIXME: check for VoD
      const stream = performance.asset_group.assets.find(asset => asset.type == AssetType.LiveStream);
      const sk = await SigningKey.findOne({ _id: stream.signing_key__id });

      // Host_info eager loads signing_key, which is very convenient usually
      // but we do not wanna send keys and such over the wire
      return {
        stream_key: stream.meta.stream_key,
        signing_key: {
          _id: sk._id,
          created_at: sk.created_at,
          mux_key_id: sk.mux_key_id
        }
      };
    }
  };

  updateVisibility: IControllerEndpoint<IPerformance> = {
    validators: {
      body: object({ visibility: enums(enumToValues(Visibility) as Visibility[]) })
    },
    // Only Admin/Owner can update visibility, but editors can update other fields
    // Must also be onboarded to be able to change visibility of a performance
    authorisation: AuthStrat.runner(
      {
        hid: IdFinderStrat.findHostIdFromPerformanceId
      },
      AuthStrat.and(
        AuthStrat.hostIsOnboarded(m => m.hid),
        AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
      )
    ),
    controller: async req => {
      const perf = await getCheck(Performance.findOne({ _id: req.params.pid }, { relations: ['asset_group'] }));

      perf.visibility = req.body.visibility;
      return (await perf.save()).toFull();
    }
  };

  updatePerformance: IControllerEndpoint<IPerformance> = {
    validators: {
      body: Validators.Objects.DtoPerformanceDetails
    },
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.hasHostPermission(HostPermission.Editor, map => map.hid)
    ),
    // authorisation: AuthStrat.none,
    controller: async req => {
      const performance = await getCheck(Performance.findOne({ _id: req.params.pid }, { relations: { host: true } }));

      // The act of saving the performance is only possible if the host has checked the consent box
      // Will only be triggered the first time the host saves
      const consent = await this.gdprService.readHostUploadConsent(performance.host, performance);
      if (!consent) await this.gdprService.addHostUploadConsent(performance.host, performance);

      await performance.update(req.body);
      return performance.toFull();
    }
  };

  createPaymentIntent: IControllerEndpoint<IPaymentIntentClientSecret> = {
    authorisation: AuthStrat.isLoggedIn,
    validators: {
      body: Validators.Objects.DtoCreatePaymentIntent
    },
    controller: async req => {
      const body: DtoCreatePaymentIntent<PurchaseableType.Ticket> = req.body;

      // Check that an amount was passed if allow_any donation peg selected
      if (body.options?.selected_dono_peg == 'allow_any' && body.options?.allow_any_amount == null)
        throw new ErrorHandler(HTTP.BadRequest);

      // Find the ticket the User is attempting to buy
      const ticket = await getCheck(
        Ticket.findOne({
          relations: {
            performance: {
              host: true
            }
          },
          where: {
            _id: req.params.tid
          },
          select: {
            performance: {
              _id: true,
              host: {
                _id: true,
                stripe_account_id: true
              }
            }
          }
        })
      );

      // Can't sell more than there are tickets
      if (ticket.quantity_remaining == 0) throw new ErrorHandler(HTTP.Forbidden, '@@error.forbidden');

      // In the case of a Paid Ticket
      let amount = ticket.amount;

      // Donation Ticket, set the amount equal to whatever donation peg amount was provided
      if (body.options?.selected_dono_peg) {
        // Don't allow stupid users to throw their life savings away
        if (body.options.selected_dono_peg == 'allow_any' && amount > BASE_AMOUNT_MAP[ticket.currency] * 200)
          throw new ErrorHandler(HTTP.BadRequest, '@@validation.too_long');

        amount =
          body.options.selected_dono_peg == 'allow_any'
            ? body.options.allow_any_amount
            : getDonoAmount(body.options.selected_dono_peg, ticket.currency);
      }

      // Stripe uses a PaymentIntent object to represent the **intent** to collect payment from a customer,
      // tracking charge attempts and payment state changes throughout the process.
      // Find (& check) the PaymentMethod that belongs to the logged-in user making the PaymentIntent
      const platformPaymentMethod = await getCheck(
        PaymentMethod.findOne({
          relations: ['user'],
          where: {
            _id: body.payment_method_id,
            user: {
              _id: req.session.user._id
            }
          }
        })
      );

      // Since this product exists on the Hosts Connected Account, we need to clone the customer
      // and their PaymentMethod over to the hosts Account
      // https://stripe.com/docs/payments/payment-methods/connect#cloning-payment-methods
      const method = await this.stripe.paymentMethods.create(
        {
          customer: platformPaymentMethod.user.stripe_customer_id,
          payment_method: platformPaymentMethod.stripe_method_id
        },
        { stripeAccount: ticket.performance.host.stripe_account_id }
      );
      // Create a charge on the card, which the user will then accept locally
      const res = await this.stripe.paymentIntents.create(
        {
          application_fee_amount: ticket.amount * 0.1, // IMPORTANT: have requirements on exact commission pricing
          payment_method_types: ['card'],
          payment_method: method.id,
          amount: amount,
          currency: ticket.currency, // ISO code - https://stripe.com/docs/currencies
          metadata: to<IStripeChargePassthrough>({
            // Passed through to webhook when charge successful
            user_id: platformPaymentMethod.user._id,
            purchaseable_id: ticket._id,
            purchaseable_type: PurchaseableType.Ticket,
            payment_method_id: platformPaymentMethod._id,
            // null -> null
            // true -> to<ConsentOpt>('hard-out')
            // false -> to<ConsentOpt>('soft-in')
            host_marketing_consent:
              body.options.hard_host_marketing_opt_out === null
                ? null
                : body.options.hard_host_marketing_opt_out
                ? to<ConsentOpt>('hard-out')
                : to<ConsentOpt>('soft-in'),
            platform_marketing_consent: body.options.stageup_marketing_opt_in ? to<ConsentOpt>('hard-in') : null
          })
        },
        {
          // The Account on whose behalf we are creating the PaymentIntent
          stripeAccount: ticket.performance.host.stripe_account_id
        }
      );

      // Return client secret to user, who will use it to confirmPayment()
      // with the CC info if they wish to actually buy the ticket
      return {
        client_secret: res.client_secret,
        stripe_method_id: method.id
      };
    }
  };

  softDeletePerformance: IControllerEndpoint<void> = {
    // By getting the hostId from the performanceId & then checking if the user has the host
    // permission, there is an implicit intersection, because the UHI will not be returned
    // if the user is not part of the host in which the performance belongs to
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
    ),
    controller: async req => {
      this.performanceService.softDeletePerformance(req.params.pid, req.body.removal_reason, req.locale);
    }
  };

  cancelPerformance: IControllerEndpoint<void> = {
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
    ),
    controller: async req => {
      this.performanceService.cancelPerformance(req.params.pid, req.body.removal_reason, req.locale);
    }
  };

  restorePerformance: IControllerEndpoint<void> = {
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
    ),
    controller: async req => {
      await this.performanceService.restorePerformance(req.params.pid);
    }
  };

  createTicket: IControllerEndpoint<ITicket> = {
    validators: { body: Validators.Objects.DtoCreateTicket },
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.hasHostPermission(HostPermission.Admin, map => map.hid)
    ),
    controller: async req => {
      return (await this.performanceService.createTicket(req.params.pid, req.body)).toFull();
    }
  };

  readTickets: IControllerEndpoint<IEnvelopedData<ITicketStub[], NUUID[]>> = {
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.hasHostPermission(HostPermission.Editor, map => map.hid)
    ),
    controller: async req => {
      const tickets = await Ticket.find({
        relations: {
          performance: true
        },
        where: {
          deleted_at: null,
          is_cancelled: false,
          performance: {
            _id: req.params.pid
          }
        },
        select: {
          performance: { _id: true }
        }
      });

      const currentTime = timestamp();
      return {
        data: tickets.map(t => t.toStub()),
        __client_data: tickets
          .filter(t => t.is_visible && t.start_datetime < currentTime && currentTime < t.end_datetime)
          .map(t => t._id)
      };
    }
  };

  readTicket: IControllerEndpoint<ITicket> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const ticket = await getCheck(
        Ticket.findOne({
          _id: req.params.tid
        })
      );

      return ticket.toFull();
    }
  };

  updateTicket: IControllerEndpoint<ITicket> = {
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.hasHostPermission(HostPermission.Admin, map => map.hid)
    ),
    controller: async req => {
      // Make a clone of the ticket so that users who have purchased an older one
      // get the details of the ticket before it was modified
      const ticket = await getCheck(Ticket.findOne({ _id: req.params.tid }));

      // Clone the ticket & overwrite fields with those from req.body
      const newTicket = new Ticket(
        pick(ticket, [
          'type',
          'currency',
          'amount',
          'name',
          'quantity',
          // 'fees',
          'start_datetime',
          'end_datetime',
          'is_visible',
          'dono_pegs',
          'is_quantity_visible'
        ])
      );

      // Updating the remaining quantity according to the new quantity from the request body
      newTicket.quantity_remaining = req.body.quantity - (ticket.quantity - ticket.quantity_remaining);

      // Set relationship by _id rather than getting performance object
      newTicket.performance = req.params.pid as any;
      newTicket.version = ticket.version += 1;
      newTicket.update(
        pick(req.body, [
          'currency',
          'amount',
          'name',
          'quantity',
          // 'fees',
          'start_datetime',
          'end_datetime',
          'is_visible',
          'dono_pegs',
          'is_quantity_visible'
        ])
      );

      await ticket.softRemove();
      return newTicket.toFull();
    }
  };

  bulkUpdateTicketQtyVisibility: IControllerEndpoint<void> = {
    validators: { body: object({ is_quantity_visible: boolean() }) },
    authorisation: AuthStrat.runner(
      {
        hid: IdFinderStrat.findHostIdFromPerformanceId
      },
      AuthStrat.hasHostPermission(HostPermission.Admin, map => map.hid)
    ),
    controller: async req => {
      // bulk update all performance tickets
      await this.ORM.createQueryBuilder()
        .update(Ticket)
        .set({ is_quantity_visible: req.body.is_quantity_visible })
        .where('performance__id = :pid', { pid: req.params.pid })
        .execute();
    }
  };

  generateSignedToken: IControllerEndpoint<ISignedToken> = {
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const performance = await getCheck(
        Performance.findOne({
          where: {
            _id: req.params.pid
          },
          relations: { tickets: true, host: true },
          select: {
            tickets: { _id: true },
            host: { _id: true }
          }
        })
      );

      // Check the asset actually exists
      const asset = await getCheck(Asset.findOne({ _id: req.params.aid }));

      // Find all invoices that belongs to a user for all tickets on this performance
      const invoices =
        // Only search if there are tickets...otherwise typeORM throws a fit with the In() operator being empty
        performance.tickets.length &&
        (
          await User.findOne({
            where: {
              _id: req.session.user._id,
              invoices: {
                ticket: { _id: In(performance.tickets.map(t => t._id)) }
              }
            },
            relations: {
              invoices: { ticket: true }
            },
            select: {
              _id: true,
              invoices: { _id: true, ticket: { _id: true } }
            }
          })
        )?.invoices;

      if (invoices?.length > 0) {
        // We have an Access Token, provisioned by means of purchase, subscription etc.
        // check this access token's claim provides access to this asset
        for await (let invoice of invoices) {
          const accessToken = await AccessToken.findOne(
            { provisioner_id: invoice._id },
            { relations: { claim: true } }
          );
          if (!accessToken) continue;

          // Check many-to-many exists between claim & asset to verify this tokens claims allow access
          if ((await accessToken.claim.verify(asset)) == false) continue;

          // There's a match! Now sign the token & return to the client
          const sk = await SigningKey.findOne({ _id: asset.signing_key__id });
          const token = sk.sign(asset as Asset<SignableAssetType>);
          return token;
        }
        // We've exhaused all invoices & still not match, check the other options...
      }

      // If they haven't purchased a ticket with a valid claim, we should check
      //  - if they're a member of the host which created the performance,
      //    so provision a token on-the-fly for them to be able to watch without purchasing
      const [isMemberOfHost] = await AuthStrat.runner(
        { hid: async () => performance.host._id },
        AuthStrat.isMemberOfHost(m => m.hid)
      )(req);

      if (isMemberOfHost) {
        const sk = await SigningKey.findOne({ _id: asset.signing_key__id });
        const token = sk.sign(asset as Asset<SignableAssetType>);
        return token;
      }

      // No AssetToken & not a member of a host, so user is not allowed!
      throw new ErrorHandler(HTTP.Forbidden, '@@error.user_has_no_claim');
    }
  };

  /**
   * @description For uploading performance pictures/trailers - NOT VoD
   * VoD must be done one time only, when the performance is created
   */
  createAsset: IControllerEndpoint<ICreateAssetRes | void> = {
    authorisation: AuthStrat.runner(
      {
        hid: IdFinderStrat.findHostIdFromPerformanceId
      },
      AuthStrat.hasHostPermission(HostPermission.Admin, map => map.hid)
    ),
    validators: {
      body: object({
        is_signed: boolean(),
        type: enums([AssetType.Image, AssetType.Video]),
        tags: array(enums(AssetTags))
      })
    },
    // For AssetType.Image assets later
    controller: async req => {
      const body: DtoCreateAsset = req.body;
      const performance = await getCheck(Performance.findOne({ _id: req.params.pid }, { relations: ['asset_group'] }));

      switch (body.type) {
        case AssetType.Video: {
          return await transact(async txc => {
            const asset = new VideoAsset(performance.asset_group, body.tags);
            const video = await asset.setup(
              this.mux,
              {
                cors_origin: Env.FRONTEND.URL,
                new_asset_settings: {
                  playback_policy: body.is_signed ? 'signed' : 'public'
                }
              },
              {
                asset_owner_id: performance._id,
                asset_owner_type: AssetOwnerType.Performance
              },
              txc
            );

            asset.group = performance.asset_group;
            await txc.save(asset);

            return to<ICreateAssetRes>({
              upload_url: video.url
            });
          });
        }
        case AssetType.Image: {
          // TODO: Implement performance image assets https://alacrityfoundationteam31.atlassian.net/browse/SU-885
          throw new ErrorHandler(HTTP.ServerError, '@@error.not_implemented');
        }
      }
    }
  };

  deleteTicket: IControllerEndpoint<void> = {
    authorisation: AuthStrat.runner(
      {
        hid: IdFinderStrat.findHostIdFromPerformanceId
      },
      AuthStrat.hasHostPermission(HostPermission.Admin, map => map.hid)
    ),
    controller: async req => {
      const ticket = await getCheck(Ticket.findOne({ _id: req.params.tid }));
      await ticket.softRemove();
    }
  };

  readVideoAssetSignedUrl: IControllerEndpoint<ICreateAssetRes> = {
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.and(
        AuthStrat.hasHostPermission(HostPermission.Admin, map => map.hid),
        AuthStrat.custom(async req => {
          // Check asset is part of the performances asset group
          const group = await AssetGroup.findOne({ owner__id: req.params.pid });
          if (!group) return false;
          return group.assets.map(a => a._id).includes(req.params.aid);
        })
      )
    ),
    controller: async req => {
      const asset = await getCheck(VideoAsset.findOne({ _id: req.params.aid }));
      if (asset.type !== AssetType.Video) throw new ErrorHandler(HTTP.BadRequest, '@@error.not_a_video');
      return {
        upload_url: asset.meta.presigned_upload_url
      };
    }
  };

  changeThumbnails: IControllerEndpoint<AssetDto | void> = {
    validators: {
      query: object({
        replaces: optional(Validators.Fields.nuuid),
        tag: enums(AssetTags)
      })
    },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Editor),
    middleware: Middleware.file(2048, ACCEPTED_IMAGE_MIME_TYPES).single('file'),
    controller: async req => {
      const performance = await getCheck(Performance.findOne({ where: { _id: req.params.pid } }));

      // Only allow up to 5 thumbnails at any one time
      if (
        performance.asset_group.assets.filter(a => a.type == AssetType.Image && a.tags.includes('thumbnail')).length ==
        5
      )
        throw new ErrorHandler(HTTP.Forbidden, '@@error.too_many_thumbnails');

      // Delete whatever file this is supposed to be replacing
      if (req.query.replaces) {
        // Delete the thumbnail this one is replacing
        const asset = performance.asset_group.assets.find(
          a => a.type == AssetType.Image && a._id == req.query.replaces
        ) as ImageAsset;
        await asset?.delete(this.blobs);
      }

      // Check that there is a file...
      if (!req.file) return;

      const asset = await transact(async txc => {
        const asset = new ImageAsset(performance.asset_group, [req.query.tag as AssetTag, 'thumbnail']);
        await asset.setup(
          this.blobs,
          { file: req.file },
          {
            asset_owner_type: AssetOwnerType.Performance,
            asset_owner_id: performance._id
          },
          txc
        );
        return await txc.save(asset);
      });

      return asset.toDto();
    }
  };

  deleteAsset: IControllerEndpoint<void> = {
    authorisation: AuthStrat.runner(
      { hid: IdFinderStrat.findHostIdFromPerformanceId },
      AuthStrat.and(
        AuthStrat.hasHostPermission(HostPermission.Editor, map => map.hid),
        AuthStrat.custom(async req => {
          // Check asset is part of the performances asset group
          const group = await AssetGroup.findOne({ owner__id: req.params.pid });
          if (!group) return false;
          return group.assets.map(a => a._id).includes(req.params.aid);
        })
      )
    ),
    controller: async req => {
      const asset = await getCheck(Asset.findOne({ _id: req.params.aid }));
      switch (asset.type) {
        case AssetType.LiveStream:
          return await (asset as LiveStreamAsset).delete(this.mux);
        case AssetType.Video:
          return await (asset as VideoAsset).delete(this.mux);
        case AssetType.Image:
          return await (asset as ImageAsset).delete(this.blobs);
      }
    }
  };

  updatePublicityPeriod: IControllerEndpoint<IPerformance> = {
    validators: { body: object({ start: Validators.Fields.timestamp, end: Validators.Fields.timestamp }) },
    authorisation: AuthStrat.hasHostPermission(HostPermission.Editor),
    controller: async req => {
      const performance = await getCheck(
        Performance.findOne({ where: { _id: req.params.pid }, relations: { tickets: true } })
      );

      const period: IPerformance['publicity_period'] = req.body;

      // https://alacrityfoundationteam31.atlassian.net/browse/SU-901
      // The schedule for a performance should never be set before the dates set for selling tickets.
      // It could either coincide with the ticket schedule or start after the ticket period is over.
      if (performance.tickets.some(ticket => !ticket.is_cancelled && ticket.start_datetime < period.start))
        throw new ErrorHandler(HTTP.BadRequest, '@@error.publicity_period_outside_ticket_period');

      performance.publicity_period = req.body;

      performance.status = PerformanceStatus.Scheduled;
      await performance.save();
      await this.bus.publish('performance.publicity_period_changed', { performance_id: performance._id }, req.locale);

      return performance.toFull();
    }
  };

  setRating: IControllerEndpoint<void> = {
    validators: {
      body: object({ rate_value: Validators.Fields.rating }),
      params: object({ pid: Validators.Fields.nuuid })
    },
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      if (0 <= req.body.rating && req.body.rating <= 1)
        throw new ErrorHandler(HTTP.BadRequest, '@@error.invalid_rating');
      // Check current user exists with the session ID
      const myself = await getCheck(User.findOne({ _id: req.session.user._id }));
      // Check performance exists with performance ID
      const performance = await getCheck(Performance.findOne({ where: { _id: req.params.pid } }));
      // Check if user has already rated this performance.
      const existingRating = await this.ORM.createQueryBuilder(Rating, 'rating')
        .where('rating.user__id = :uid', { uid: req.session.user._id })
        .andWhere('rating.performance__id = :hid', { hid: req.params.pid })
        .getOne();
      // If they have rated, update the existing rating
      if (existingRating) {
        await transact(async txc => {
          // Update the performance rating_total. The rating_count does not change.
          performance.rating_total = performance.rating_total - existingRating.rating + req.body.rate_value.toFixed(4);
          await txc.save(performance);
          // Update the rating
          existingRating.rating = req.body.rate_value.toFixed(4);
          await txc.save(existingRating);
        });
      } else {
        // Create new rating and update total count/rating
        await transact(async txc => {
          // Update the rating_total. Increment the rating count.
          performance.rating_total = performance.rating_total + req.body.rate_value.toFixed(4);
          performance.rating_count++;
          await txc.save(performance);
          // Create new rating
          const newRating = new Rating(myself, performance, req.body.rate_value.toFixed(4));
          await txc.save(newRating);
        });
      }
    }
  };

  deleteRating: IControllerEndpoint<void> = {
    validators: { params: object({ pid: Validators.Fields.nuuid }) },
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      const existingRating = await getCheck(
        this.ORM.createQueryBuilder(Rating, 'rating')
          .where('rating.user__id = :uid', { uid: req.session.user._id })
          .andWhere('rating.performance__id = :pid', { pid: req.params.pid })
          .getOne()
      );
      if (!existingRating) throw new ErrorHandler(HTTP.BadRequest, '@@error.no_rating_exists');
      // Check performance exists with performance ID
      const performance = await getCheck(Performance.findOne({ where: { _id: req.params.pid } }));
      // Create new rating and update total count/rating
      await transact(async txc => {
        // Update the performance rating_total. Increment the rating count.
        performance.rating_total = performance.rating_total - existingRating.rating;
        performance.rating_count--;
        await txc.save(performance);

        await txc.remove(existingRating);
      });
    }
  };

  // Adds a like from database with the current users ID, the provided performance ID and the location of where the user liked the performance
  toggleLike: IControllerEndpoint<void> = {
    // Check the location has been passed in the body and that it matches one of the locations from where a user can like.
    validators: {
      body: object({
        location: enums(Object.values(LikeLocation))
      })
    },
    authorisation: AuthStrat.isLoggedIn,
    controller: async req => {
      this.userService.toggleLike({
        user_id: req.session.user._id,
        target_type: req.body.location,
        target_id: req.params.pid
      });
    }
  };

  registerView: IControllerEndpoint<void> = {
    authorisation: AuthStrat.none,
    middleware: Middleware.rateLimit(60, Env.RATE_LIMIT, this.redis.client),
    controller: async req => {
      const { pid: performanceId, aid: assetId } = req.params;
      const performance = await getCheck(Performance.findOne({ _id: performanceId }));

      // asset must be on this performance
      if (!performance.asset_group.assets.map(g => g._id).includes(assetId))
        throw new ErrorHandler(HTTP.BadRequest, '@@error.incorrect');

      const view = new AssetView(req.session.user?._id, assetId, performanceId);
      await view.save();

      // increment counter
      performance.views += 1;
      await performance.save();
    }
  };
}
