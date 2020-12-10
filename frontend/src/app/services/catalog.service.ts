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

  // search(
  //   term: string,
  //   nodeType: NodeType
  // ): Observable<Paginated<ISpeciesStub | IDeviceStub>> {
  //   console.log("searching!", nodeType, term);
  //   switch (nodeType) {
  //     case NodeType.Species:
  //       return this.http.get<Paginated<ISpeciesStub>>(
  //         `/api/species/search?query=${term}`
  //       );
  //   }
  // }
}
