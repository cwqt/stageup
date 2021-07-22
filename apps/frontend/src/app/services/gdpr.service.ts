import { ConsentableType } from '@core/interfaces';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GdprService {
  constructor(private http: HttpClient) {}

  //router.get <any> ("/api/gdpr", Gdpr.getGeneralTerms());
  getLatestDocument(type: ConsentableType): Promise<any> {
    return this.http.get<any>(`/api/gdpr?type=${type}`).toPromise();
  }
}
