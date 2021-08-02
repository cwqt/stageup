import { ConsentableType, IConsentable, IEnvelopedData } from '@core/interfaces';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GdprService {
  constructor(private http: HttpClient) {}

  //router.get <IConsentable<ConsentableType>> ("/api/gdpr/document/latest", Gdpr.getLatestDocument());;
  getLatestDocument(type: ConsentableType): Promise<IConsentable<ConsentableType>> {
    return this.http.get<IConsentable<ConsentableType>>(`/api/gdpr/documents/latest?type=${type}`).toPromise();
  }

  //router.get <IEnvelopedData<IConsentable<ConsentableType>[]>> ("/api/gdpr/document/all-latest", Gdpr.getAllLatestDocuments());;
  getAllLatestDocuments(): Promise<IEnvelopedData<IConsentable<ConsentableType>[]>> {
    return this.http.get<IEnvelopedData<IConsentable<ConsentableType>[]>>(`/api/gdpr/documents/all-latest`).toPromise();
  }
}
