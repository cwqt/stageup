import { BaseAppService } from '@frontend/services/app.service';
import { GdprService } from 'apps/frontend/src/app/services/gdpr.service';
import { UiTable } from '@frontend/ui-lib/table/table.class';
import { Component, OnInit } from '@angular/core';
import { i18n, unix } from '@core/helpers';
import { LOCALE_ID, Inject } from '@angular/core';
import { IConsentable, ConsentableType } from '@core/interfaces';

@Component({
  selector: 'frontend-admin-gdpr-documents',
  templateUrl: './admin-gdpr-documents.component.html',
  styleUrls: ['./admin-gdpr-documents.component.scss']
})
export class AdminGdprDocumentsComponent implements OnInit {
  table: UiTable<IConsentable<ConsentableType>>;

  constructor(
    private gdprService: GdprService,
    private appService: BaseAppService,
    @Inject(LOCALE_ID) public locale: string
  ) {}

  async ngOnInit(): Promise<void> {
    // Setup table for displaying most recent documents
    this.table = new UiTable<IConsentable<ConsentableType>>({
      resolver: () => this.gdprService.getAllLatestDocuments(),
      pagination: {},
      columns: [
        {
          label: $localize`Document type`,
          accessor: document => {
            switch (document.type) {
              case 'privacy_policy':
                return $localize`Privacy Policy`;
              case 'general_toc':
                return $localize`General Terms & Conditions`;
              case 'uploaders_toc':
                return $localize`Uploaders Terms & Conditions`;
              case 'cookies':
                return $localize`Cookies`;
            }
          }
        },
        {
          label: $localize`Updated`,
          accessor: document => i18n.date(unix(document.created_at), this.locale)
        },
        {
          label: $localize`Version`,
          accessor: document => document.version
        },
        {
          label: $localize`Link to document`,
          accessor: () => 'View',
          click_handler: document => {
            window.open(document.document_location, '_blank'); // Open direct link to PDF URL in new tab
          }
        }
      ],
      actions: [
        {
          label: $localize`Upload New`,
          type: 'button',
          click: document => null, // TODO: Navigate to 'add document' page and add backend functionality
          icon: 'upload'
        }
      ]
    });
  }
}
