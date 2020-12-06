import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPerformance } from '@eventi/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {

  constructor(private http:HttpClient) { }

  getPerformance(pid:number | string):Promise<IPerformance> {
    return this.http.get<IPerformance>(`/api/performances/${pid}`).toPromise();
  }

}
