import { ConsentableType, IConsentable, IEnvelopedData, RichText } from '@core/interfaces';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import fd from 'form-data';

@Injectable({
  providedIn: 'root'
})
export class GdprService {
  constructor(private http: HttpClient) {}

  //router.get <IConsentable<ConsentableType>> ("/api/gdpr/documents/:type/:version", Gdpr.readLatestDocument());;
  readLatestDocument(type: ConsentableType): Promise<IConsentable<ConsentableType>> {
    return this.http.get<IConsentable<ConsentableType>>(`/api/gdpr/documents/${type}/latest`).toPromise();
  }

  //router.get <IEnvelopedData<IConsentable<ConsentableType>[]>> ("/api/gdpr/document/:version", Gdpr.readAllLatestDocuments());;
  readAllLatestDocuments(): Promise<IConsentable<ConsentableType>[]> {
    return this.http.get<IConsentable<ConsentableType>[]>(`/api/gdpr/documents/latest`).toPromise();
  }

  //router.post <void> ("/api/gdpr/document/upload", Gdpr.uploadDOcument());;
  uploadDocument(type: string, data: fd | null): Promise<void> {
    return this.http.post<void>(`/api/gdpr/documents/${type}/supersede`, data).toPromise();
  }

  //router.post<void>("/gdpr/:hid/set-stream-compliance",Gdpr.setStreamCompliance());
  updateStreamCompliance(isCompliant: boolean, hostId: string, performanceId: string): Promise<void> {
    return this.http
      .put<void>(`/api/gdpr/${hostId}/${performanceId}/set-stream-compliance`, { is_compliant: isCompliant })
      .toPromise();
  }
}
