import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import {
  AssetView,
  EMAIL_PROVIDER,
  I18N_PROVIDER,
  i18n,
  Invoice,
  Mail,
  Performance,
  PerformanceAnalytics,
  PostgresProvider,
  POSTGRES_PROVIDER
} from '@core/api';
import { PurchaseableType } from '@core/interfaces';
import { Inject, Service } from 'typedi';
import { Connection } from 'typeorm';
import { WorkerScript } from '..';
import { collectMetrics } from './analytics.worker';

@Service()
export default class extends WorkerScript<'collect_performance_analytics'> {
  constructor(
    @Inject(POSTGRES_PROVIDER) private ORM: Connection,
    @Inject(EMAIL_PROVIDER) private email: Mail,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>
  ) {
    super();

    this.script = async job => {
      const { data } = job;
      const performance = await Performance.findOne({ where: { _id: data.performance_id } });

      await collectMetrics(
        new PerformanceAnalytics(performance),
        {
          total_ticket_sales: async (start, end) => {
            // Get all tickets that are on this performance
            const { tickets } = await Performance.findOne({
              where: { _id: performance._id },
              relations: { tickets: true }
            });

            // Get a count of all invoices across all tickets purchased between this period
            return await this.ORM.createQueryBuilder(Invoice, 'i')
              .where('i.type = :type', { type: PurchaseableType.Ticket })
              .andWhere('i.ticket__id IN (:...ticketIds)', { ticketIds: tickets.map(t => t._id) })
              .andWhere('i.purchased_at BETWEEN :start AND :end', { start, end })
              .getCount();
          },
          total_revenue: async (start, end) => {
            // Get all tickets that are on this performance
            const { tickets } = await Performance.findOne({
              where: { _id: performance._id },
              relations: { tickets: true }
            });

            // Get the sum of all invoice quantities sold between this period
            const { sum } = (await this.ORM.createQueryBuilder(Invoice, 'i')
              .where('i.type = :type', { type: PurchaseableType.Ticket })
              .andWhere('i.ticket__id IN (:...ticketIds)', { ticketIds: tickets.map(t => t._id) })
              .andWhere('i.purchased_at BETWEEN :start AND :end', { start, end })
              .select('SUM(i.amount)', 'sum') // returns as string if matches, or null if none
              .getRawOne()) || { sum: '0' };

            return parseInt(sum);
          },
          trailer_views: async (start, end) => {
            const trailer = performance.asset_group.assets.find(a => a.tags.includes('trailer'));
            return trailer
              ? this.ORM.createQueryBuilder(AssetView, 'view')
                  .where('view.asset__id = :aid', { aid: trailer._id })
                  .andWhere('view.viewed_at BETWEEN :end AND :start', { start, end })
                  .getCount()
              : 0;
          },
          performance_views: async (start, end) => {
            const primaryAsset = performance.asset_group.assets.find(a => a.tags.includes('primary'));
            return primaryAsset
              ? this.ORM.createQueryBuilder(AssetView, 'view')
                  .where('view.asset__id = :aid', { aid: primaryAsset._id })
                  .andWhere('view.viewed_at BETWEEN :end AND :start', { start, end })
                  .getCount()
              : 0;
          }
        },
        job
      );
    };
  }
}
