import { IEnvelopedData } from '../common/envelope.interface';
import { IFeedPerformanceStub } from '../performances/performance.interface';

export interface IHostFeed {
  upcoming: IEnvelopedData<IFeedPerformanceStub[]>;
}
