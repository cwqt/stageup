import { Component, OnInit } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { CatalogService } from "../../services/catalog.service";

import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from "rxjs/operators";

@Component({
  selector: "app-catalog",
  templateUrl: "./catalog.component.html",
  styleUrls: ["./catalog.component.scss"],
})
export class CatalogComponent implements OnInit {
  // results$: Observable<Paginated<any>>;
  private searchTerms = new Subject<string>();

  loading: boolean = false;
  errors = {
    search: "",
  };

  colors = [
    "red",
    "magenta",
    "purple",
    "blue",
    "cyan",
    "teal",
    "green",
    "gray",
    "cool-gray",
    "warm-gray",
  ];

  constructor(private catalogService: CatalogService) {}

  ngOnInit(): void {
    // this.results$ = this.searchTerms.pipe(
    //   debounceTime(300), // wait 300ms after each keystroke before considering the term
    //   distinctUntilChanged(), // ignore new term if same as previous term
    //   switchMap((
    //     term: string // switch to new search observable each time the term changes
    //   ) => this.catalogService.search(term, this.activeCategory))
    // );

    // this.results$.subscribe((v) => console.log(v));

    setTimeout(() => {
      this.search("pea");
    }, 500);
  }

  search(term: string): void {
    console.log(term);
    this.searchTerms.next(term);
  }

  getColor(str: string): string {
    return this.colors[str.length % this.colors.length];
  }
}
