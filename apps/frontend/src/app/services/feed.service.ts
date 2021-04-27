import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IEnvelopedData, IPerformanceStub } from '@core/interfaces';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class FeedService {

  constructor(private userService: UserService, private http: HttpClient) {}

  // this will eventually evolve into its own interface as we develop, but for now just return
  // a list of performances
  getFeed(page:number=0, perPage:number=5):Promise<IEnvelopedData<IPerformanceStub[]>> {
    return this.http.get<IEnvelopedData<IPerformanceStub[]>>(`/api/performances?page=${page}&per_page=${perPage}`).toPromise();
  }
}
