import { IEnvelopedData } from '@core/interfaces';
import { IHostStub } from '../hosts/host.interface';
import { IPerformanceStub } from '../performances/performance.interface';

export interface ISearchResponse {
  hosts: IEnvelopedData<IHostStub[]>;
  performances: IEnvelopedData<IPerformanceStub[]>;
}
