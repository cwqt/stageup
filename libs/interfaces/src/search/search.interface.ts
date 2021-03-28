import { IHostStub } from "../hosts/host.interface";
import { IPerformanceStub } from "../performances/performance.interface";
import { IEnvelopedData } from '@core/interfaces'

export interface ISearchResponse {
    hosts: IEnvelopedData<IHostStub[]>, 
    performances: IEnvelopedData<IPerformanceStub[]>  
}