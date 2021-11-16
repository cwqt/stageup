import { findAssets } from '@core/helpers';
import { Component, Input, OnInit } from '@angular/core';
import { AssetType, DtoPerformance } from '@core/interfaces';
import { ICacheable } from '@frontend/app.interfaces';

@Component({
  selector: 'app-host-performance-details-keys',
  templateUrl: './host-performance-details-keys.component.html',
  styleUrls: ['./host-performance-details-keys.component.scss']
})
export class HostPerformanceDetailsKeysComponent implements OnInit {
  @Input() streamKey: string;

  constructor() {}

  ngOnInit(): void {}
}
