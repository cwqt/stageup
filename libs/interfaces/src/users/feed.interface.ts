import { IEnvelopedData } from '../common/envelope.interface';
import { IHostStub } from '../hosts/host.interface';
import { IFeedPerformanceStub } from '../performances/performance.interface';

export interface IFeed {
  everything: IEnvelopedData<IFeedPerformanceStub[]>;
  upcoming: IEnvelopedData<IFeedPerformanceStub[]>;
  // personalised /// etc...
  // promoted: IEnvelopedData<IFeedPerformanceStub[]>
  hosts: IEnvelopedData<IHostStub[]>;
  follows?: IEnvelopedData<IFeedPerformanceStub[]>;
}
