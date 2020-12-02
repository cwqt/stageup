import { Component, OnInit } from "@angular/core";
import { IFarmStub, Paginated, IFarm } from "@cxss/interfaces";
import { OrganisationService } from "src/app/services/organisation.service";
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";

import { filter, switchMap } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: "app-farms",
  templateUrl: "./farms.component.html",
  styleUrls: ["./farms.component.scss"],
})
export class FarmsComponent implements OnInit {
  farms = {
    data: <IFarmStub[]>[],
    error: <string>"",
    loading: <boolean>false,
    tableRows: ["name", "_id", "racks", "location"],
  };

  selectedFarm: string;
  isOutletting: boolean = false;

  constructor(
    private orgService: OrganisationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.farms.loading = true;
    this.orgService
      .getFarms()
      .then((paginated: Paginated<IFarmStub>) => {
        this.farms.data = paginated.results;
      })
      .catch((e) => (this.farms.error = e))
      .finally(() => (this.farms.loading = false));

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        switchMap(
          () =>
            (this.route.firstChild && this.route.firstChild.params) || of({})
        )
      )
      .subscribe((params) => {
        console.log(params);
        this.isOutletting = Object.keys(params).includes("fid");
      });

    this.route.params
      .subscribe((params) => {
        this.isOutletting = this.route.children.length ? true : false;
      })
      .unsubscribe();
  }

  openFarmDetail(farm: IFarmStub) {
    this.selectedFarm = farm._id;
    this.router.navigate([`/farms`, farm._id]);
  }
}
