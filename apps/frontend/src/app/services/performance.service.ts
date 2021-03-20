import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DtoAccessToken,
  DtoCreateTicket,
  IEnvelopedData,
  IPaymentIntentClientSecret,
  IPerformance,
  IPerformanceHostInfo,
  IPerformanceStub,
  ITicket,
  ITicketStub,
  Visibility
} from '@core/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  constructor(private http: HttpClient) {}

  readPerformance(performanceId: string): Promise<IEnvelopedData<IPerformance, DtoAccessToken>> {
    return this.http
      .get<IEnvelopedData<IPerformance, DtoAccessToken>>(`/api/performances/${performanceId}`)
      .toPromise();
  }

  readPerfomances(
    search_query: string,
    page: number = 0,
    perPage: number = 10
  ): Promise<IEnvelopedData<IPerformanceStub[], null>> {
    return this.http
      .get<IEnvelopedData<IPerformanceStub[], null>>(
        `/api/performances/?search_query=${search_query}&page=${page}&perPage=${perPage}`
      )
      .toPromise();
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

  // router.get <ITicketStub[]> ("/performances/:pid/tickets", Perfs.readTickets());
  readTickets(performanceId: string): Promise<ITicketStub[]> {
    return this.http.get<ITicketStub[]>(`/api/performances/${performanceId}/tickets`).toPromise();
  }

  // router.delete <void> ("/performances/:pid/tickets/:tid", Perfs.deleteTicket());
  deleteTicket(performanceId: string, ticketId: string): Promise<void> {
    return this.http.delete<void>(`/api/performances/${performanceId}/tickets/${ticketId}`).toPromise();
  }

  // router.post <IPaymentICS> ("/tickets/:tid/payment-intent", Perfs.createPaymentIntent());
  createPaymentIntent(ticket:ITicketStub):Promise<IPaymentIntentClientSecret> {
    return this.http.post<IPaymentIntentClientSecret>(`/api/tickets/${ticket._id}/payment-intent`, null).toPromise();
  }
}
