import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ISearchResponse } from '@core/interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  $searchQuery: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(private http: HttpClient) {}

  search(
    searchQuery: string,
    page: number,
    perPage: number,
    returnOnly: 'hosts' | 'performances'
  ): Promise<ISearchResponse> {
    return this.http
      .get<ISearchResponse>(
        `/api/search?query=${searchQuery}&page=${page}&per_page=${perPage}${
          returnOnly ? `&return_only=${returnOnly}` : ''
        }`
      )
      .toPromise();
  }
}
