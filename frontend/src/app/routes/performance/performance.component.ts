import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IPerformance, IPerformanceStub } from "@cxss/interfaces";
import { ICacheable } from "src/app/app.interfaces";
import { PerformanceService } from "src/app/services/performance.service";

@Component({
  selector: "app-performance",
  templateUrl: "./performance.component.html",
  styleUrls: ["./performance.component.scss"],
})
export class PerformanceComponent implements OnInit {
  performance: ICacheable<IPerformance> = {
    data: null,
    loading: false,
    error: null,
  };

  constructor(
    private performanceService: PerformanceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getPerformance();
  }

  async getPerformance() {
    this.performance.loading = true;
    return this.performanceService
      .getPerformance(this.route.snapshot.paramMap.get("pid"))
      .then((p) => (this.performance.data = p))
      .catch((e) => (this.performance.error = e))
      .finally(() => (this.performance.loading = false));
  }
}
