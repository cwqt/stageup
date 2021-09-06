import {
  ErrorHandler,
  EventBus,
  EVENT_BUS_PROVIDER,
  getCheck,
  ModuleService,
  Performance,
  POSTGRES_PROVIDER
} from '@core/api';
import { HTTP, ILocale, IRemovalReason, PerformanceStatus, RemovalType } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';

@Service()
export class PerformanceService extends ModuleService {
  constructor(@Inject(EVENT_BUS_PROVIDER) private bus: EventBus, @Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  async softDeletePerformance(performanceId: string, removalReason: IRemovalReason, locale: ILocale) {
    const perf = await getCheck(Performance.findOne({ _id: performanceId }));

    if (perf.status === PerformanceStatus.Live)
      throw new ErrorHandler(HTTP.Forbidden, `@@performance.cannot_delete_live`);

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

    if (perf.status === PerformanceStatus.Live)
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
}
