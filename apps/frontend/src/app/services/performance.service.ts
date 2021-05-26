import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IQueryParams, querize } from '@core/helpers';
import {
  DtoCreateTicket,
  DtoPerformance,
  IEnvelopedData,
  IPaymentIntentClientSecret,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  ITicket,
  ITicketStub,
  Visibility,
  DtoCreateAsset,
  ICreateAssetRes,
  NUUID,
  DtoCreatePaymentIntent,
  PurchaseableType,
  ISignedToken
} from '@core/interfaces';
import { BehaviorSubject } from 'rxjs';
import { Except } from 'type-fest';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  // fuck you angular router giant piec eof shit !!!!!
  $activeHostPerformanceId: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(private http: HttpClient) {}

  readPerformance(performanceId: string): Promise<DtoPerformance> {
    return this.http.get<DtoPerformance>(`/api/performances/${performanceId}`).toPromise();
  }

  readPerfomances(query: IQueryParams): Promise<IEnvelopedData<IPerformanceStub[]>> {
    return this.http.get<IEnvelopedData<IPerformanceStub[], null>>(`/api/performances${querize(query)}`).toPromise();
  }

  readPerformanceHostInfo(performanceId: string): Promise<IPerformanceHostInfo> {
    return this.http.get<IPerformanceHostInfo>(`/api/performances/${performanceId}/host-info`).toPromise();
  }

  updateVisibility(performanceId: string, visibility: Visibility): Promise<IPerformance> {
    return this.http
      .put<IPerformance>(`/api/performances/${performanceId}/visibility`, { visibility: visibility })
      .toPromise();
  }

  //router.put <IPerf> ("/performances/:pid", Perfs.updatePerformance())
  updatePerformance(performanceId: string, data: { name: string; description: string }): Promise<IPerformance> {
    return this.http.put<IPerformance>(`/api/performances/${performanceId}`, data).toPromise();
  }

  // router.post <ITicket> ("/performances/:pid/tickets", Perfs.createTicket());
  createTicket(performanceId: string, data: DtoCreateTicket): Promise<ITicket> {
    return this.http.post<ITicket>(`/api/performances/${performanceId}/tickets`, data).toPromise();
  }

  // router.get <IEnvelopedData<ITicketStub[], NUUID[]>> ("/performances/:pid/tickets", Perfs.readTickets());
  readTickets(performanceId: string): Promise<IEnvelopedData<ITicketStub[], NUUID[]>> {
    return this.http
      .get<IEnvelopedData<ITicketStub[], NUUID[]>>(`/api/performances/${performanceId}/tickets`)
      .toPromise();
  }

  readTicket(performanceId: string, ticketId: string): Promise<ITicket> {
    return this.http.get<ITicket>(`/api/performances/${performanceId}/tickets/${ticketId}`).toPromise();
  }

  // router.delete <void> ("/performances/:pid/tickets/:tid", Perfs.deleteTicket());
  deleteTicket(performanceId: string, ticketId: string): Promise<void> {
    return this.http.delete<void>(`/api/performances/${performanceId}/tickets/${ticketId}`).toPromise();
  }

  // router.put <ITicket> ("/performances/:pid/tickets/:tid", Perfs.updateTicket());
  updateTicket(performanceId: string, ticketId: string, data: Except<DtoCreateTicket, 'type'>): Promise<ITicket> {
    return this.http.put<ITicket>(`/api/performances/${performanceId}/tickets/${ticketId}`, data).toPromise();
  }

  // router.post <IPaymentICS> ("/tickets/:tid/payment-intent", Perfs.createPaymentIntent());
  createTicketPaymentIntent(
    data?: DtoCreatePaymentIntent<PurchaseableType.Ticket>
  ): Promise<IPaymentIntentClientSecret> {
    return this.http
      .post<IPaymentIntentClientSecret>(`/api/tickets/${data.purchaseable_id}/payment-intent`, data)
      .toPromise();
  }

  // router.put <void> ("/performances/:pid/tickets/qty-visibility", Perfs.bulkUpdateTicketQtyVisibility());
  bulkUpdateTicketQtyVisibility(performanceId: string, value: boolean) {
    return this.http
      .put<void>(`/api/performances/${performanceId}/tickets/qty-visibility`, { is_quantity_visible: value })
      .toPromise();
  }

  deletePerformance(performanceId: string) {
    return this.http.delete(`/api/performances/${performanceId}`).toPromise();
  }

  // router.post <ICreateAssetRes|void> ("/performances/:pid/assets", Perfs.createAsset());
  createAsset(performanceId: string, data: DtoCreateAsset): Promise<ICreateAssetRes> {
    // FUTURE expand to support static s3 assets, and not just MUX assets
    return this.http.post<ICreateAssetRes>(`/api/performances/${performanceId}/assets`, data).toPromise();
  }

  // router.get <ICreateAssetRes> ("/performances/:pid/assets/:aid/signed-url", Perfs.readVideoAssetSignedUrl());
  readVideoAssetSignedUrl(performanceId: string, assetId: string): Promise<ICreateAssetRes> {
    return this.http
      .get<ICreateAssetRes>(`/api/performances/${performanceId}/assets/${assetId}/signed-url`)
      .toPromise();
  }

  // router.get <ISignedToken> ("/performances/:pid/assets/:aid/token", Perfs.generateSignedToken());
  generateSignedToken(performanceId: string, assetId: string): Promise<ISignedToken> {
    return this.http.get<ISignedToken>(`/api/performances/${performanceId}/assets/${assetId}/token`).toPromise();
  }
}
