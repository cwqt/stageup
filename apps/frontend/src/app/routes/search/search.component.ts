import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { IEnvelopedData, IHostStub, IPerformanceStub } from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '../../app.interfaces';
import { BaseAppService } from '../../services/app.service';
import { SearchService } from '../../services/search.service';
import { HelperService } from '../../services/helper.service';
import { PerformanceBrochureComponent } from '../performance/performance-brochure/performance-brochure.component';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @ViewChild('hostPaginator') hostPaginator: MatPaginator;
  @ViewChild('perfPaginator') perfPaginator: MatPaginator;

  hosts: ICacheable<IEnvelopedData<IHostStub[]>> = createICacheable([], { page: 1, perPage: 10 });
  performances: ICacheable<IEnvelopedData<IPerformanceStub[]>> = createICacheable([], { page: 1, perPage: 10 });

  searchQuery: string;

  constructor(
    private baseAppService: BaseAppService,
    private route: ActivatedRoute,
    private searchService: SearchService,
    public dialog: MatDialog,
    private helperService: HelperService
  ) {}

  async ngOnInit() {
    await this.baseAppService.componentInitialising(this.route);

    // Listen for change in Observable value for search box / url query param values
    this.searchService.$searchQuery.subscribe(v => {
      this.searchQuery = v;
      this.search(0, 10);
    });

    // Check if when coming in by URL there is a searchQuery, then fan it to subscribers
    this.searchQuery = this.baseAppService.getQueryParam('query');
    if (this.searchQuery) this.searchService.$searchQuery.next(this.searchQuery);
  }

  async search(page: number, perPage: number, returnOnly?: 'hosts' | 'performances') {
    if (returnOnly == 'hosts') {
      cachize(this.searchService.search(this.searchQuery, page, perPage, 'hosts'), this.hosts, d => d.hosts);
    } else if (returnOnly == 'performances') {
      cachize(
        this.searchService.search(this.searchQuery, page, perPage, 'performances'),
        this.performances,
        d => d.performances
      );
    } else {
      this.hosts.loading = true;
      this.performances.loading = true;
      this.searchService
        .search(this.searchQuery, page, perPage, null)
        .then(d => {
          this.hosts.data = d.hosts;
          this.performances.data = d.performances;
          this.perfPaginator.length = d.performances.__paging_data.total;
          this.hostPaginator.length = d.hosts.__paging_data.total;
        })
        .catch(e => {
          this.performances.error = e;
          this.hosts.error = e;
        })
        .finally(() => {
          this.hosts.loading = false;
          this.performances.loading = false;
        });
    }
  }

  openDialogPerf(performance: IPerformanceStub): void {
    this.helperService.showDialog(
      this.dialog.open(PerformanceBrochureComponent, {
        data: { performance },
        width: '800px',
        position: { top: '5% ' }
      }),
      () => {}
    );
  }

  openDialogHost(hostname) {
    this.baseAppService.navigateTo(`/@${hostname}`);
  }
}
