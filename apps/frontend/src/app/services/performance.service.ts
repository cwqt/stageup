import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEnvelopedData, IPerformance, IPerformanceStub } from '@core/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  constructor(private http: HttpClient) {}

  getPerformance(performanceId: string): Promise<IPerformance> {
    return this.http.get<IPerformance>(`/api/performances/${performanceId}`).toPromise();
  }

  getPerfomances(search_query: string, page: number = 0, perPage: number = 10): Promise<IEnvelopedData<IPerformanceStub[], null>> {
    return this.http.get<IEnvelopedData<IPerformanceStub[], null>>(`/api/performances/?search_query=${search_query}&page=${page}&perPage=${perPage}`).toPromise();
  }
}
