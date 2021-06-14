import { ErrorHandler } from '@backend/common/error';
import {
  AccessToken,
  Asset,
  BaseController,
  getCheck,
  Host,
  IControllerEndpoint,
  AssetGroup,
  PaymentMethod,
  Performance,
  Ticket,
  Validators,
  User,
  SigningKey,
  VideoAsset,
  transact,
  LiveStreamAsset,
  Auth
} from '@core/api';
import { enumToValues, getDonoAmount, timestamp, to } from '@core/helpers';
import {
  AssetOwnerType,
  AssetType,
  BASE_AMOUNT_MAP,
  DtoCreatePaymentIntent,
  DtoPerformance,
  HostPermission,
  HTTP,
  DtoCreateAsset,
  ICreateAssetRes,
  IEnvelopedData,
  IPaymentIntentClientSecret,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  IStripeChargePassthrough,
  ITicket,
  ITicketStub,
  NUUID,
  pick,
  ISignedToken,
  PurchaseableType,
  TokenProvisioner,
  Visibility,
  TicketType,
  DtoCreateTicket,
  AssetTags,
  IAsset,
  PerformanceStatus
} from '@core/interfaces';
import { Braket } from 'aws-sdk';
import { SignableAssetType } from 'libs/shared/src/api/entities/performances/signing-key.entity';
import { array, boolean, enums, object } from 'superstruct';
import { In } from 'typeorm';
import { BackendProviderMap } from '..';
import AuthStrat from '../common/authorisation';
import idFinderStrategies from '../common/authorisation/id-finder-strategies';
import IdFinderStrat from '../common/authorisation/id-finder-strategies';
import Env from '../env';

export default class PerformanceController extends BaseController<BackendProviderMap> {
  // router.post <IPerf> ("/hosts/:hid/performances", Perfs.createPerformance());
  createPerformance(): IControllerEndpoint<IPerformance> {
    return {
      // validators: { body: Validators.Objects.DtoCreatePerformance },
      authorisation: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: req.params.hid }));

        return await this.ORM.transaction(async txc => {
          const performance = await new Performance(req.body, host).save();
          await performance.setup(txc);

          // Temporary single asset per performance; either vod or stream, at-least
          // until multi-assets stories are completed
          if (req.body.type == 'vod') {
            const asset = new VideoAsset(performance.asset_group, ['primary']);
            await asset.setup(
              this.providers.mux,
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
              this.providers.mux,
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
          this.providers.bus.publish('performance.created', p, req.locale);
          return p;
        });
      }
    };
  }

  //router.get <IE<IPerfS[], null>> ("/performances", Perfs.readPerformances());
  readPerformances(): IControllerEndpoint<IEnvelopedData<IPerformanceStub[]>> {
    return {
      authorisation: AuthStrat.none,
      controller: async req => {
        return await this.ORM.createQueryBuilder(Performance, 'p')
          .innerJoinAndSelect('p.host', 'host')
          .andWhere('p.visibility = :state', { state: Visibility.Public })
          .filter({
            genre: { subject: 'p.genre' }
          })
          .paginate(p => p.toStub());
      }
    };
  }

  readPerformance(): IControllerEndpoint<DtoPerformance> {
    return {
      authorisation: AuthStrat.none,
      controller: async req => {
        const performance = await getCheck(
          Performance.findOne({
            where: {
              _id: req.params.pid
            },
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

        const response: DtoPerformance = {
          data: performance.toFull(),
          __client_data: null
        };

        return response;
      }
    };
  }

  readPerformanceHostInfo(): IControllerEndpoint<IPerformanceHostInfo> {
    return {
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
  }

  updateVisibility(): IControllerEndpoint<IPerformance> {
    return {
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
  }

  updatePerformance(): IControllerEndpoint<IPerformance> {
    return {
      authorisation: AuthStrat.runner(
        { hid: IdFinderStrat.findHostIdFromPerformanceId },
        AuthStrat.hasHostPermission(HostPermission.Editor, map => map.hid)
      ),
      controller: async req => {
        const perf = await getCheck(Performance.findOne({ _id: req.params.pid }, { relations: ['asset_group'] }));
        await perf.update({
          name: req.body.name,
          description: req.body.description
        });

        return perf.toFull();
      }
    };
  }

  createPaymentIntent(): IControllerEndpoint<IPaymentIntentClientSecret> {
    return {
      authorisation: AuthStrat.isLoggedIn,
      validators: { body: Validators.Objects.DtoCreatePaymentIntent },
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
        const method = await this.providers.stripe.connection.paymentMethods.create(
          {
            customer: platformPaymentMethod.user.stripe_customer_id,
            payment_method: platformPaymentMethod.stripe_method_id,
            metadata: { __origin_url: Env.WEBHOOK_URL }
          },
          { stripeAccount: ticket.performance.host.stripe_account_id }
        );

        // Create a charge on the card, which the user will then accept locally
        const res = await this.providers.stripe.connection.paymentIntents.create(
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
              payment_method_id: platformPaymentMethod._id
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
  }

  deletePerformance(): IControllerEndpoint<void> {
    return {
      // By getting the hostId from the performanceId & then checking if the user has the host
      // permission, there is an implicit intersection, because the UHI will not be returned
      // if the user is not part of the host in which the performance belongs to
      authorisation: AuthStrat.runner(
        { hid: IdFinderStrat.findHostIdFromPerformanceId },
        AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
      ),
      controller: async req => {
        const perf = await getCheck(Performance.findOne({ _id: req.params.pid }));
        perf.status = PerformanceStatus.Deleted;
        await perf.softRemove();
      }
    };
  }

  createTicket(): IControllerEndpoint<ITicket> {
    return {
      validators: { body: Validators.Objects.DtoCreateTicket },
      authorisation: AuthStrat.runner(
        { hid: IdFinderStrat.findHostIdFromPerformanceId },
        AuthStrat.hasHostPermission(HostPermission.Admin, map => map.hid)
      ),
      controller: async req => {
        const performance = await getCheck(Performance.findOne({ _id: req.params.pid }, { relations: ['host'] }));
        const body: DtoCreateTicket = req.body;

        // Must first have a Connected Stripe Account to create paid/dono tickets
        if (!performance.host.stripe_account_id && body.type != TicketType.Free)
          throw new ErrorHandler(HTTP.Unauthorised, '@@host.requires_stripe_connected');

        const ticket = await this.ORM.transaction(async txc => {
          const ticket = new Ticket(body);
          const claim = await ticket.setup(performance, txc);

          // IMPORTANT for now we will assign all signed assets to this claim
          const group = await AssetGroup.findOne({ owner__id: req.params.pid }, { relations: ['assets'] });
          await claim.assign(
            group.assets.filter(asset => asset.signing_key__id != null),
            txc
          );

          return txc.save(ticket);
        });

        return ticket.toFull();
      }
    };
  }

  readTickets(): IControllerEndpoint<IEnvelopedData<ITicketStub[], NUUID[]>> {
    return {
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
  }

  readTicket(): IControllerEndpoint<ITicket> {
    return {
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
  }

  updateTicket(): IControllerEndpoint<ITicket> {
    return {
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
            'fees',
            'start_datetime',
            'end_datetime',
            'is_visible',
            'dono_pegs',
            'is_quantity_visible'
          ])
        );

        // Persist remaining quantity
        newTicket.quantity_remaining = ticket.quantity_remaining;

        // Set relationship by _id rather than getting performance object
        newTicket.performance = req.params.pid as any;
        newTicket.version = ticket.version += 1;
        newTicket.update(
          pick(req.body, [
            'currency',
            'amount',
            'name',
            'quantity',
            'fees',
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
  }

  bulkUpdateTicketQtyVisibility(): IControllerEndpoint<void> {
    return {
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
  }

  generateSignedToken(): IControllerEndpoint<ISignedToken> {
    return {
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
        )(req, this.providers);

        if (isMemberOfHost) {
          const sk = await SigningKey.findOne({ _id: asset.signing_key__id });
          const token = sk.sign(asset as Asset<SignableAssetType>);
          return token;
        }

        // No AssetToken & not a member of a host, so user is not allowed!
        throw new ErrorHandler(HTTP.Forbidden, '@@error.user_has_no_claim');
      }
    };
  }

  /**
   * @description For uploading performance pictures/trailers - NOT VoD
   * VoD must be done one time only, when the performance is created
   */
  createAsset(): IControllerEndpoint<ICreateAssetRes | void> {
    return {
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
        const performance = await getCheck(
          Performance.findOne({ _id: req.params.pid }, { relations: ['asset_group'] })
        );

        console.log(body);

        switch (body.type) {
          case AssetType.Video: {
            return await transact(async txc => {
              const asset = new VideoAsset(performance.asset_group, body.tags);
              const video = await asset.setup(
                this.providers.mux,
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

              console.log(asset);

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
  }

  deleteTicket(): IControllerEndpoint<void> {
    return {
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
  }

  readVideoAssetSignedUrl(): IControllerEndpoint<ICreateAssetRes> {
    return {
      authorisation: AuthStrat.runner(
        {
          hid: idFinderStrategies.findHostIdFromPerformanceId
        },
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
  }
}
