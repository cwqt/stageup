import { AppService } from 'apps/frontend/src/app/services/app.service';
import { HostService } from '@frontend/services/host.service';
import { IPerformanceStub, AssetType } from '@core/interfaces';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { CreatePerformanceComponent } from './../../routes/host/host-performances/create-performance/create-performance.component';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '@frontend/services/helper.service';
import { Component, OnInit, LOCALE_ID, Inject, Input } from '@angular/core';
import { i18n, unix, findAssets } from '@core/helpers';

@Component({
  selector: 'app-table-box',
  templateUrl: './table-box.component.html',
  styleUrls: ['./table-box.component.scss']
})
export class TableBoxComponent implements OnInit {
  @Input() table: UiTable<any>;
  @Input() title?: string;
  @Input() buttonText?: string;
  @Input() buttonFunction?: () => any;

  constructor() {}

  ngOnInit(): void {}
}
