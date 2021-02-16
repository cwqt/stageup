import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { IEnvelopedData, IPerformanceStub } from '@core/interfaces';
import { ICacheable } from '../../../app.interfaces';
import { PerformanceModalComponent } from '../../../components/modals/performance-modal.component';
import { BaseAppService } from '../../../services/app.service';
import { PerformanceService } from '../../../services/performance.service';

@Component({
  selector: 'eventi-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  public searchQuery: string;
  public searchResults:ICacheable<IEnvelopedData<IPerformanceStub[], void>> = {
    data: null,
    error: "",
    loading: false
  }
  
  constructor(
    private baseAppService: BaseAppService, 
    private route:ActivatedRoute, 
    private performanceService: PerformanceService,
    public dialog: MatDialog
    ){}

  get pager():MatPaginator { return this.paginator }

  async ngOnInit(){
    await this.baseAppService.componentInitialising(this.route);
    this.searchQuery = this.baseAppService.getQueryParam('search_query');
    this.searchPerformances();
  }

  async searchPerformances(){
    this.searchResults.loading = true;
    return this.performanceService.readPerfomances(this.searchQuery, this.pager?.pageIndex, this.pager?.pageSize)
    .then( d =>{
      this.searchResults.data = d;
      if(this.pager) {
        this.pager.length = d.__paging_data.total;
      }
    })
    .catch(e => this.searchResults.error = e)
    .finally(() => this.searchResults.loading = false);
  }

  openPerformanceModal(performanceId: number): void{
    const modalRef = this.dialog.open(PerformanceModalComponent, {      
      data: this.searchResults.data.data.find(p => p._id == performanceId as unknown as string)});
  }

}
