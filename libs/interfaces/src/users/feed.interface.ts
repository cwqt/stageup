import { IEnvelopedData } from '../common/envelope.interface';
import { IHostStub } from '../hosts/host.interface';
import { IPerformanceStub } from '../performances/performance.interface';

export interface IFeed {
  everything: IEnvelopedData<IPerformanceStub[]>;
  upcoming: IEnvelopedData<IPerformanceStub[]>;
  // personalised /// etc...
  // promoted: IEnvelopedData<IPerformanceStub[]>
  hosts: IEnvelopedData<IHostStub[]>;
  follows?: IEnvelopedData<IPerformanceStub[]>;
}
