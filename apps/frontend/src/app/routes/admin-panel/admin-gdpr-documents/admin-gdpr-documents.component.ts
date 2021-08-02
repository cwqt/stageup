import { GdprService } from './../../../services/gdpr.service';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { Component, OnInit } from '@angular/core';
import { i18n, unix } from '@core/helpers';

@Component({
  selector: 'frontend-admin-gdpr-documents',
  templateUrl: './admin-gdpr-documents.component.html',
  styleUrls: ['./admin-gdpr-documents.component.scss']
})
export class AdminGdprDocumentsComponent implements OnInit {
  table: UiTable<any>;
  locale = 'en';

  constructor(private gdprService: GdprService) {}

  async ngOnInit(): Promise<void> {
    const documents = await this.gdprService.getAllLatestDocuments();
    console.log(documents);

    // Setup table for performance analytics, will fetch data when instantiated
    this.table = new UiTable<any>({
      actions: [],
      resolver: query => this.gdprService.getAllLatestDocuments(query),
      pagination: {},
      columns: [
        {
          label: $localize`Document Type`,
          accessor: v => v.type
        },
        {
          label: $localize`Updated`,
          accessor: v => i18n.date(unix(v.created_at), this.locale)
        },
        {
          label: $localize`Version`,
          accessor: v => v.version
        }
      ]
    });
  }
}
