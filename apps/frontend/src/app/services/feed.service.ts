import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { querize } from '@core/helpers';
import { IEnvelopedData, IFeed, IHostStub, IFeedPerformanceStub, PaginationOptions } from '@core/interfaces';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  constructor(private userService: UserService, private http: HttpClient) {}

  getFeed(
    paging?: { [index in keyof IFeed]?: PaginationOptions },
    hid?: { hid: string },
  ): Promise<IEnvelopedData<IFeedPerformanceStub[] | IHostStub[]>> {
    // TODO: come up with something better
    const queryParams = hid ? { upcoming: { ...paging.upcoming, ...hid }} : paging;
    return this.http.get<IEnvelopedData<IFeedPerformanceStub[]>>(`/api/myself/feed${querize(queryParams)}`).toPromise();
  }
}
