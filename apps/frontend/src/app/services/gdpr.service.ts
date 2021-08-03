import { ConsentableType, IConsentable, IEnvelopedData, RichText } from '@core/interfaces';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import fd from 'form-data';

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

  //router.post <void> ("/api/gdpr/document/upload", Gdpr.uploadDOcument());;
  uploadDocument(type: string, data: fd | null): Promise<void> {
    return this.http.post<void>(`/api/gdpr/documents/upload?type=${type}`, data).toPromise();
  }
}
