import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConsentService {

  constructor(
    private http: HttpClient,
  ) {}

  //router.get <any> ("/api/consent/general-terms", Consent.getGeneralTerms());
  getGeneralTermsAndConditions(): Promise<any> {
    return this.http.get<any>(`/api/consent/general-terms`).toPromise();
  }
}
