import {
  ErrorHandler,
  EventBus,
  EVENT_BUS_PROVIDER,
  getCheck,
  ModuleService,
  Invoice,
  Performance,
  POSTGRES_PROVIDER,
  AssetGroup,
  Ticket,
  transact
} from '@core/api';
import { timestamp } from '@core/helpers';
import {
  DtoCreateTicket,
  HTTP,
  ILocale,
  IRemovalReason,
  PerformanceStatus,
  PerformanceType,
  RemovalType,
  TicketType
} from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';

@Service()
export class PerformanceService extends ModuleService {
  constructor(@Inject(EVENT_BUS_PROVIDER) private bus: EventBus, @Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  async createTicket(performanceId: string, body: DtoCreateTicket): Promise<Ticket> {
    const performance = await getCheck(Performance.findOne({ _id: performanceId }, { relations: ['host'] }));
    // Must first have a Connected Stripe Account to create paid/dono tickets
    if (!performance.host.stripe_account_id && body.type != TicketType.Free)
      throw new ErrorHandler(HTTP.Unauthorised, '@@host.requires_stripe_connected');

    const ticket = await transact(async txc => {
      const ticket = new Ticket(body);
      const claim = await ticket.setup(performance, txc);

      // IMPORTANT for now we will assign all signed assets to this claim
      const group = await AssetGroup.findOne({ owner__id: performanceId }, { relations: ['assets'] });
      await claim.assign(
        group.assets.filter(asset => asset.signing_key__id != null),
        txc
      );

      return txc.save(ticket);
    });

    return ticket;
  }

  async softDeletePerformance(performanceId: string, removalReason: IRemovalReason, locale: ILocale) {
    const perf = await getCheck(Performance.findOne({ _id: performanceId }));
    const currentDate = timestamp(new Date());
    const inPremierPeriod: boolean =
      currentDate >= perf.publicity_period.start && currentDate <= perf.publicity_period.end;

    //If perf is live as a live show
    if (perf.status === PerformanceStatus.Live)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_delete_live`);

    //If perf is live in VOD terms (within its publicity period)
    if (perf.performance_type === PerformanceType.Vod && inPremierPeriod)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_cancel_live`);

    if (perf.status === PerformanceStatus.Complete)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_delete_after_occurrence`);

    //Soft delete the performance
    perf.status = PerformanceStatus.Deleted;
    perf.removal_reason = removalReason;
    await perf.save();
    await perf.softRemove();

    return await this.bus.publish(
      'performance.removed',
      {
        performance_id: performanceId,
        removal_reason: removalReason,
        removal_type: RemovalType.SoftDelete
      },
      locale
    );
  }

  async cancelPerformance(performanceId: string, removalReason: IRemovalReason, locale: ILocale) {
    const performance = await getCheck(Performance.findOne({ _id: performanceId }));
    const currentDate = timestamp(new Date());
    const inPremierPeriod: boolean =
      currentDate >= performance.publicity_period.start && currentDate <= performance.publicity_period.end;

    //If performance is live as a live show
    if (performance.status === PerformanceStatus.Live)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_cancel_live`);

    //If performance is live in VOD terms (within its publicity period)
    if (performance.performance_type === PerformanceType.Vod && inPremierPeriod)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_cancel_live`);

    if (performance.status === PerformanceStatus.Complete)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_cancel_after_occurrence`);

    performance.status = PerformanceStatus.Cancelled;
    performance.removal_reason = removalReason;
    performance.publicity_period.start = null;
    performance.publicity_period.end = null;
    await performance.save();

    return await this.bus.publish(
      'performance.removed',
      {
        performance_id: performanceId,
        removal_reason: removalReason,
        removal_type: RemovalType.Cancel
      },
      locale
    );
  }

  async restorePerformance(performanceId: string) {
    const performance = await getCheck(Performance.findOne({ _id: performanceId }));

    if (performance.status !== PerformanceStatus.Cancelled)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_restore_active_performance`);

    performance.status = PerformanceStatus.PendingSchedule;
    await performance.save();
  }

  async readUserInvoice(performanceId: string, userId: string) {
    return await this.ORM.createQueryBuilder(Invoice, 'invoice')
      .where('invoice.user__id = :user_id', { user_id: userId })
      .leftJoinAndSelect('invoice.ticket', 'ticket')
      .leftJoinAndSelect('ticket.performance', 'performance')
      .andWhere('performance._id = :pid', { pid: performanceId })
      .getOne();
  }
}
