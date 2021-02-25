import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DtoAccessToken, IEnvelopedData, IPerformance, IPerformanceHostInfo, IPerformanceStub, IPerformanceUserInfo, Visibility } from '@core/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  
  constructor(private http: HttpClient) {}

  readPerformance(performanceId: string): Promise<IEnvelopedData<IPerformance, DtoAccessToken>> {
    return this.http.get<IEnvelopedData<IPerformance, DtoAccessToken>>(`/api/performances/${performanceId}`).toPromise();
  }

  readPerfomances(search_query: string, page: number = 0, perPage: number = 10): Promise<IEnvelopedData<IPerformanceStub[], null>> {
    return this.http.get<IEnvelopedData<IPerformanceStub[], null>>(`/api/performances/?search_query=${search_query}&page=${page}&perPage=${perPage}`).toPromise();
  }

  readPerformanceHostInfo(performanceId:string):Promise<IPerformanceHostInfo> {
    return this.http.get<IPerformanceHostInfo>(`/api/performances/${performanceId}/host_info`).toPromise();
  }

  updateVisibility(performanceId:string, visibility:Visibility):Promise<IPerformance> {
    return this.http.put<IPerformance>(`/api/performances/${performanceId}/visibility`, { visibility: visibility }).toPromise();
  }

  //router.put <IPerf> ("/performances/:pid", Perfs.updatePerformance())
  updatePerformance(performanceId:string, data: { name: string, description: string }):Promise<IPerformance> {
    return this.http.put<IPerformance>(`/api/performances/${performanceId}`, data).toPromise();
  }  
}
