import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";

import { IUser } from '@core/interfaces';

@Injectable({
  providedIn: "root",
})
export class ProfileService {
  constructor(private http: HttpClient) {
  }
}
