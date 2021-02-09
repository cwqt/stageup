import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPerformance } from '@core/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  constructor(private http: HttpClient) {}

  getPerformance(performanceId: string): Promise<IPerformance> {
    return this.http.get<IPerformance>(`/api/performances/${performanceId}`).toPromise();
  }
}
