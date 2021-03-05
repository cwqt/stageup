import { Component, OnInit } from '@angular/core';
import { DtoAccessToken, IEnvelopedData, IPerformance } from '@core/interfaces';
import { MyselfService } from '../../services/myself.service';

@Component({
  selector: 'app-performance-watch',
  templateUrl: './performance-watch.component.html',
  styleUrls: ['./performance-watch.component.scss']
})
export class PerformanceWatchComponent implements OnInit {
  performance:IEnvelopedData<IPerformance, DtoAccessToken>;

  constructor(private myselfService:MyselfService) { }

  ngOnInit(): void {
    this.myselfService.$currentlyWatching.subscribe(d => this.performance = d);
  }
}
