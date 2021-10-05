import {
  ErrorHandler,
  EventBus,
  EVENT_BUS_PROVIDER,
  getCheck,
  ModuleService,
  Invoice,
  Performance,
  POSTGRES_PROVIDER
} from '@core/api';
import { timestamp } from '@core/helpers';
import { HTTP, ILocale, IRemovalReason, PerformanceStatus, PerformanceType, RemovalType } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';

@Service()
export class PerformanceService extends ModuleService {
  constructor(@Inject(EVENT_BUS_PROVIDER) private bus: EventBus, @Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
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
    const perf = await getCheck(Performance.findOne({ _id: performanceId }));
    const currentDate = timestamp(new Date());
    const inPremierPeriod: boolean =
      currentDate >= perf.publicity_period.start && currentDate <= perf.publicity_period.end;

    //If perf is live as a live show
    if (perf.status === PerformanceStatus.Live)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_cancel_live`);

    //If perf is live in VOD terms (within its publicity period)
    if (perf.performance_type === PerformanceType.Vod && inPremierPeriod)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_cancel_live`);

    if (perf.status === PerformanceStatus.Complete)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_cancel_after_occurrence`);

    perf.status = PerformanceStatus.Cancelled;
    perf.removal_reason = removalReason;
    await perf.save();

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

  async readUserInvoice(performanceId: string, userId: string) {
    return await this.ORM.createQueryBuilder(Invoice, 'invoice')
      .where('invoice.user__id = :user_id', { user_id: userId })
      .leftJoinAndSelect('invoice.ticket', 'ticket')
      .leftJoinAndSelect('ticket.performance', 'performance')
      .andWhere('performance._id = :pid', { pid: performanceId })
      .getOne();
  }
}
