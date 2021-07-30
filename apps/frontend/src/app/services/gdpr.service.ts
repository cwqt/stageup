import { ConsentableType, IConsentable } from '@core/interfaces';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GdprService {
  constructor(private http: HttpClient) {}

  //router.get <IConsentable<ConsentableType>> ("/api/gdpr/document/latest", Gdpr.getGeneralTerms());;
  getLatestDocument(type: ConsentableType): Promise<IConsentable<ConsentableType>> {
    return this.http.get<IConsentable<ConsentableType>>(`/api/gdpr/documents/latest?type=${type}`).toPromise();
  }

  //router.post<void>("/gdpr/:hid/set-stream-compliance",Gdpr.setStreamCompliance());
  setStreamCompliance(type: ConsentableType): Promise<void> {
    return this.http.post<void>(`/api/gdpr/`, {}).toPromise();
  }
}
