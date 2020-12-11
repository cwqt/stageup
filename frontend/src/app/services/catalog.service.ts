import { Injectable } from "@angular/core";
import {
  NodeType,
} from "@eventi/interfaces";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class CatalogService {
  constructor(private http: HttpClient) {}

}
