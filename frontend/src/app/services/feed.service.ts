import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPerformanceStub } from '@eventi/interfaces';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class FeedService {

  constructor(private userService: UserService, private http: HttpClient) {}

  // this will eventually evolve into its own interface as we develop 
  getFeed():Promise<IPerformanceStub[]> {
    return this.http.get<IPerformanceStub[]>(`/api/performances`).toPromise();
  }
}
