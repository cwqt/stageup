import {
  AnalyticsTimePeriod,
  DtoPerformanceAnalytics,
  IUserConsent,
  Analytics,
  IPerformanceStub,
  IPerformance,
  DtoPerformanceIDAnalytics
} from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { ModuleService, PerformanceAnalytics } from '@core/api';
import { Connection } from 'typeorm';
import { POSTGRES_PROVIDER, UserHostMarketingConsent } from '@core/api';
import { Performance } from '@core/api';

@Service()
export class HostService extends ModuleService {
  constructor(@Inject(POSTGRES_PROVIDER) private ORM: Connection) {
    super();
  }

  async readHostMarketingLastUpdate(hostId: string): Promise<IUserConsent<'host_marketing'>['saved_at']> {
    const latestConsent = await this.ORM.createQueryBuilder(UserHostMarketingConsent, 'consent')
      .where('consent.host__id = :host_id', { host_id: hostId })
      .orderBy('consent.saved_at', 'DESC') // so we get most recently updated entries at the top
      .getOne();
    return latestConsent.saved_at;
  }

  async readAllHostPerformances(hostId: string): Promise<Performance[]> {
    return this.ORM.createQueryBuilder(Performance, 'performance')
      .innerJoin('performance.host', 'host')
      .where('host._id = :id', { id: hostId })
      .getMany();
  }

  async readAnalyticsFromPerformanceArray(
    performanceIds: Array<IPerformance['_id']>,
    period: AnalyticsTimePeriod
  ): Promise<Array<DtoPerformanceIDAnalytics>> {
    const dtos: DtoPerformanceIDAnalytics[] = [];
    for await (let performanceId of performanceIds) {
      // Get weekly aggregations sorted by period_end (when collected)
      const chunks = await this.ORM.createQueryBuilder(PerformanceAnalytics, 'analytics')
        .where('analytics.performance__id = :performanceId', { performanceId })
        .orderBy('analytics.period_ended_at', 'DESC')
        // Get twice the selected period, so we can do a comparison of latest & previous periods for trends
        .limit(Analytics.offsets[period] * 2)
        .getMany();

      dtos.push({
        performanceId,
        chunks: chunks.map(chunk => chunk.toDto())
      });
    }

    return dtos;
  }
}
