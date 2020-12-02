import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { FarmService } from "src/app/services/farm.service";

@Component({
  selector: "app-rack",
  templateUrl: "./rack.component.html",
  styleUrls: ["./rack.component.scss"],
})
export class RackComponent implements OnInit {
  cache = {
    rack: {
      data: null,
      crops: null,
      loading: false,
      error: "",
    },
  };

  selectedCrop: string;
  isOutletting: boolean = false;

  constructor(
    private farmService: FarmService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get rack() {
    return this.cache.rack.data;
  }

  ngOnInit(): void {
    this.route.params
      .subscribe((params) => {
        console.log(params);
        this.getRack(params.rid);
      })
      .unsubscribe();
  }

  getRack(rack_id: string) {
    this.cache.rack.loading = true;
    this.farmService
      .getRack(rack_id)
      .then((rack) => {
        this.cache.rack.data = rack;
      })
      .catch((e) => {
        this.cache.rack.error = e.message;
      })
      .finally(() => {
        this.cache.rack.loading = false;
      });
  }
}
