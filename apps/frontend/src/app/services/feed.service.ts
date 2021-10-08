import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { querize } from '@core/helpers';
import { IEnvelopedData, IFeed, IHostStub, IFeedPerformanceStub, PaginationOptions } from '@core/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  constructor(private http: HttpClient) {}

  getFeed(
    paging?: { [index in keyof IFeed]?: PaginationOptions }
  ): Promise<IEnvelopedData<IFeedPerformanceStub[] | IHostStub[]>> {
    let data = this.http
      .get<IEnvelopedData<IFeedPerformanceStub[]>>(`/api/myself/feed${querize(paging)}`)
      .toPromise()
      .then(v => console.log(v));
    return this.http.get<IEnvelopedData<IFeedPerformanceStub[]>>(`/api/myself/feed${querize(paging)}`).toPromise();
  }
}
