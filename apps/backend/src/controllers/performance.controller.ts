import {
  AccessToken,
  Asset,
  BaseController,
  body,
  ErrorHandler,
  getCheck,
  Host,
  IControllerEndpoint,
  PaymentMethod,
  Performance,
  query,
  single,
  Ticket,
  Validators
} from '@core/api';
import { enumToValues, getDonoAmount, timestamp, to } from '@core/helpers';
import {
  AssetOwnerType,
  AssetType,
  BASE_AMOUNT_MAP,
  DtoCreatePaymentIntent,
  DtoCreatePerformance,
  DtoPerformance,
  ErrCode,
  HostPermission,
  HTTP,
  ICreateAssetRes,
  IEnvelopedData,
  IPaymentIntentClientSecret,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  IStripeChargePassthrough,
  ITicket,
  ITicketStub,
  JobType,
  NUUID,
  pick,
  PurchaseableEntity,
  TokenProvisioner,
  Visibility
} from '@core/interfaces';
import { ObjectValidators } from 'libs/shared/src/api/validate/objects.validators';
import { BackendProviderMap } from '..';
import AuthStrat from '../common/authorisation';
import IdFinderStrat from '../common/authorisation/id-finder-strategies';
import Queue from '../common/queue';
import Env from '../env';

export default class PerformanceController extends BaseController<BackendProviderMap> {
  // router.post <IPerf> ("/hosts/:hid/performances", Perfs.createPerformance());
  createPerformance(): IControllerEndpoint<IPerformance> {
    return {
      validators: [body<DtoCreatePerformance>(Validators.Objects.DtoCreatePerformance())],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const host = await getCheck(Host.findOne({ _id: req.params.hid }));

        return await this.ORM.transaction(async txc => {
          const performance = await new Performance(req.body, host).save();
          await performance.setup(this.providers.mux, txc);

          // Push premiere to job queue for automated release
          Queue.enqueue({
            type: JobType.ScheduleRelease,
            data: {
              _id: performance._id
            },
            options: {
              // Use a repeating job with a limit of 1 to activate the scheduler
              // FIXME: use offset instead maybe?
              repeat: {
                cron: '* * * * *',
                startDate: performance.premiere_date,
                limit: 1
              }
            }
          });

          return performance.toFull();
        });
      }
    };
  }

  //router.get <IE<IPerfS[], null>> ("/performances", Perfs.readPerformances());
  readPerformances(): IControllerEndpoint<IEnvelopedData<IPerformanceStub[]>> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
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
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const performance = await getCheck(
          Performance.findOne({
            where: {
              _id: req.params.pid
            },
            relations: {
              host: true,
              tickets: true,
              asset_group: true,
              stream: {
                // TODO: add bidirectional ref on signing key to avoid this join
                // before we've checked that the user needs a token signing on the fly
                signing_key: true
              }
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

        // For logged in users, see if current user has access the performance by virtue of owning an Access Token
        if (req.session.user) {
          let token: AccessToken = await AccessToken.findOne({
            relations: ['user'],
            where: {
              user: {
                _id: req.session.user._id
              }
            },
            select: {
              user: { _id: true }
            }
          });

          // Also check if they're a member of the host which created the performance
          // & if so provision a token on-the-fly for them to be able to watch without purchasing
          if (!token) {
            const [isMemberOfHost, passthru] = await AuthStrat.runner(
              {
                hid: async () => performance.host._id
              },
              AuthStrat.isMemberOfHost(m => m.hid)
            )(req, this.providers);

            if (isMemberOfHost) {
              token = new AccessToken(passthru.uhi.user, performance, passthru.uhi.user, TokenProvisioner.User).sign(
                performance.stream.signing_key
              );
            }
          }

          // return 404 barring the user has a token if the performance is private
          if (!token && performance.visibility == Visibility.Private) throw new ErrorHandler(HTTP.NotFound);

          // set the token
          response.__client_data = {
            has_purchased: token?.provisioner_type == TokenProvisioner.Purchase,
            token: token?.access_token
          };
        }

        return response;
      }
    };
  }

  readPerformanceHostInfo(): IControllerEndpoint<IPerformanceHostInfo> {
    return {
      validators: [],
      authStrategy: AuthStrat.none,
      controller: async req => {
        const { stream } = await Performance.findOne(
          { _id: req.params.pid },
          { relations: { stream: { signing_key: true } } }
        );

        // Host_info eager loads signing_key, which is very convenient usually
        // but we do not wanna send keys and such over the wire
        return {
          stream_key: stream.meta.stream_key,
          signing_key: {
            _id: stream.signing_key._id,
            created_at: stream.signing_key.created_at,
            mux_key_id: stream.signing_key.mux_key_id
          }
        };
      }
    };
  }

  updateVisibility(): IControllerEndpoint<IPerformance> {
    return {
      validators: [
        body<{ visibility: Visibility }>({
          visibility: v => v.isIn(Object.values(Visibility))
        })
      ],
      // Only Admin/Owner can update visibility, but editors can update other fields
      // Must also be onboarded to be able to change visibility of a performance
      authStrategy: AuthStrat.runner(
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
      validators: [],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Editor),
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
      authStrategy: AuthStrat.isLoggedIn,
      validators: [
        body<DtoCreatePaymentIntent>({
          payment_method_id: v => v.isString(),
          purchaseable_type: v => v.isIn(enumToValues(PurchaseableEntity)),
          purchaseable_id: v => v.isString(),
          options: v =>
            v.custom(
              single<DtoCreatePaymentIntent['options']>({
                selected_dono_peg: v =>
                  v.optional({ nullable: true }).isIn(['lowest', 'low', 'medium', 'high', 'highest', 'allow_any']),
                allow_any_amount: v => v.optional({ nullable: true }).isInt()
              })
            )
        })
      ],
      controller: async req => {
        // TODO: have generic method for buying purchaseables
        const body: DtoCreatePaymentIntent = req.body;

        // Check that an amount was passed if allow_any donation peg selected
        if (body.options.selected_dono_peg == 'allow_any' && body.options.allow_any_amount == null)
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
        if (ticket.quantity_remaining == 0) throw new ErrorHandler(HTTP.Forbidden, ErrCode.FORBIDDEN);

        // In the case of a Paid Ticket
        let amount = ticket.amount;

        // Donation Ticket, set the amount equal to whatever donation peg amount was provided
        if (body.options.selected_dono_peg) {
          // Don't allow stupid users to throw their life savings away
          if (body.options.selected_dono_peg == 'allow_any' && amount > BASE_AMOUNT_MAP[ticket.currency] * 200)
            throw new ErrorHandler(HTTP.BadRequest, ErrCode.TOO_LONG);

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
            payment_method: platformPaymentMethod.stripe_method_id
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
              purchaseable_type: PurchaseableEntity.Ticket,
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
      validators: [],
      // By getting the hostId from the performanceId & then checking if the user has the host
      // permission, there is an implicit intersection, because the UHI will not be returned
      // if the user is not part of the host in which the performance belongs to
      authStrategy: AuthStrat.runner(
        {
          hid: IdFinderStrat.findHostIdFromPerformanceId
        },
        AuthStrat.hasHostPermission(HostPermission.Admin, m => m.hid)
      ),
      controller: async req => {
        const perf = await getCheck(Performance.findOne({ _id: req.params.pid }));
        await perf.remove();
      }
    };
  }

  createTicket(): IControllerEndpoint<ITicket> {
    return {
      validators: [body(ObjectValidators.DtoCreateTicket())],
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Admin),
      controller: async req => {
        const ticket = new Ticket(req.body);

        const performance = await getCheck(Performance.findOne({ _id: req.params.pid }, { relations: ['tickets'] }));

        await this.ORM.transaction(async txc => {
          await txc.save(ticket);
          performance.tickets.push(ticket);
          await txc.save(performance);
        });

        return ticket.toFull();
      }
    };
  }

  readTickets(): IControllerEndpoint<IEnvelopedData<ITicketStub[], NUUID[]>> {
    return {
      authStrategy: AuthStrat.hasHostPermission(HostPermission.Editor),
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
      authStrategy: AuthStrat.isLoggedIn,
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
      authStrategy: AuthStrat.runner(
        {
          hid: IdFinderStrat.findHostIdFromPerformanceId
        },
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
      validators: [body<Pick<ITicket, 'is_quantity_visible'>>({ is_quantity_visible: v => v.isBoolean() })],
      authStrategy: AuthStrat.runner(
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

  /**
   * @description For uploading performance pictures/trailers - NOT VoD
   * VoD must be done one time only, when the performance is created
   */
  createAsset(): IControllerEndpoint<ICreateAssetRes | void> {
    return {
      authStrategy: AuthStrat.runner(
        {
          hid: IdFinderStrat.findHostIdFromPerformanceId
        },
        AuthStrat.hasHostPermission(HostPermission.Admin, map => map.hid)
      ),
      validators: [
        query({
          type: v => v.isIn([AssetType.Image, AssetType.Video])
        })
      ],
      // For AssetType.Image assets later
      // preMiddlewares: [this.mws.file(2048, ["image/jpeg", "image/jpg", "image/png"]).single("file")],
      controller: async req => {
        const performance = await getCheck(
          Performance.findOne({ _id: req.params.pid }, { relations: ['asset_group'] })
        );

        switch (req.query.type) {
          case AssetType.Video: {
            return await this.ORM.transaction(async txc => {
              const asset = new Asset(AssetType.Video, performance.asset_group);
              const video = await asset.setup(
                this.providers.mux,
                txc,
                {
                  cors_origin: Env.FE_URL,
                  new_asset_settings: {
                    playback_policy: 'public'
                  }
                },
                {
                  asset_owner_id: performance._id,
                  asset_owner_type: AssetOwnerType.Performance
                }
              );

              performance.asset_group.push(asset);
              await txc.save(performance.asset_group);

              return to<ICreateAssetRes>({
                upload_url: video.url
              });
            });
          }
          case AssetType.Image: {
            // TODO: implement performance image assets
            throw new ErrorHandler(HTTP.ServerError, ErrCode.NOT_IMPLEMENTED);
          }
        }
      }
    };
  }

  deleteTicket(): IControllerEndpoint<void> {
    return {
      authStrategy: AuthStrat.runner(
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
}
