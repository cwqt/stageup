import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IQueryParams, querize } from '@core/helpers';
import {
  AssetTag,
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
  ISignedToken,
  IAssetStub,
  AssetDto,
  IRemovalReason,
  DtoRemovePerformance,
  ILike,
  LikeLocation,
  DtoPerformanceDetails
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

  readPerformance(performanceId: string, includeDeleted?: boolean): Promise<DtoPerformance> {
    return this.http
      .get<DtoPerformance>(`/api/performances/${performanceId}${querize({ include_deleted: includeDeleted })}`)
      .toPromise();
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

  //router.put <IPerf> ("/performances/:pid/update", Perfs.updatePerformance())
  updatePerformance(performanceId: string, data: DtoPerformanceDetails): Promise<IPerformance> {
    return this.http.put<IPerformance>(`/api/performances/${performanceId}/update`, data).toPromise();
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

  deletePerformance(performanceId: string, data: DtoRemovePerformance) {
    return this.http.put(`/api/performances/${performanceId}`, data).toPromise();
  }

  cancelPerformance(performanceId: string, data: DtoRemovePerformance) {
    return this.http.put(`/api/performances/${performanceId}/cancel`, data).toPromise();
  }

  restorePerformance(performanceId: string): Promise<void> {
    return this.http.put<void>(`/api/performances/${performanceId}/restore`, null).toPromise();
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

  // router.post <AssetDto> ("/performances/:pid/thumbnails", Perfs.changeThumbnails());
  changeThumbnails(performanceId: string, fd: FormData, tag: AssetTag, replaces?: string): Promise<AssetDto | void> {
    return this.http
      .post<AssetDto | void>(`/api/performances/${performanceId}/thumbnails/${querize({ tag, replaces })}`, fd)
      .toPromise();
  }

  // router.put <IPerformance> ("/performances/:pid/publicity-period", Perfs.updatePublicityPeriod());
  updatePublicityPeriod(performanceId: string, period: IPerformance['publicity_period']): Promise<IPerformance> {
    return this.http.put<IPerformance>(`/api/performances/${performanceId}/publicity-period`, period).toPromise();
  }

  // router.post <void> ("/performances/:pid/rate", Perfs.setRating());
  setRating(performanceId: string, rateValue: number): Promise<void> {
    return this.http
      .post<void>(`/api/performances/${performanceId}/rate`, { rate_value: rateValue })
      .toPromise();
  }

  // router.delete <void> ("/performances/:pid/rate", Perfs.deleteRating());
  deleteRating(performanceId: string): Promise<void> {
    return this.http.delete<void>(`/api/performances/${performanceId}/rate`).toPromise();
  }
  // router.post <void> ("/performances/:pid/toggle-like", Perfs.toggleLike());
  toggleLike(performanceId: NUUID, likeTarget: LikeLocation): Promise<void> {
    return this.http
      .post<void>(`/api/performances/${performanceId}/toggle-like`, { location: likeTarget })
      .toPromise();
  }

  // router.post <void> ("/performances/:pid/assets/:aid/views", Perfs.registerView());
  registerView(performanceId: string, assetId: string) {
    return this.http.post(`/api/performances/${performanceId}/assets/${assetId}/views`, {}).toPromise();
  }
}
