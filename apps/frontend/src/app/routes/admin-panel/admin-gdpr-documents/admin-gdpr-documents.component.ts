import { UploadDocumentDialogComponent } from './../../../components/dialogs/upload-document-dialog/upload-document-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { HelperService } from '@frontend/services/helper.service';
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
    private helperService: HelperService,
    public dialog: MatDialog,
    @Inject(LOCALE_ID) public locale: string
  ) {}

  async ngOnInit(): Promise<void> {
    // Setup table for displaying most recent documents
    // If a document doesn't exist, we instead display '-'
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
              case 'cookies':
                return $localize`Cookies`;
            }
          }
        },
        {
          label: $localize`Updated`,
          accessor: document => (document.created_at ? i18n.date(unix(document.created_at), this.locale) : '-')
        },
        {
          label: $localize`Version`,
          // Need to specifically check that version is not undefined (since a version of '0' will also be falsey)
          accessor: document => (document.version !== undefined ? document.version : '-')
        },
        {
          label: $localize`Link to document`,
          accessor: document => (document.document_location ? 'View' : ''),
          click_handler: document => {
            window.open(document.document_location, '_blank'); // Open direct link to PDF URL in new tab
          }
        }
      ],
      actions: [
        {
          label: $localize`Upload New`,
          type: 'button',
          click: document => {
            this.helperService.showDialog(
              this.dialog.open(UploadDocumentDialogComponent, {
                data: { document },
                width: '800px',
                minHeight: '500px'
              }),
              () => {
                this.table.refresh();
              }
            );
          },
          icon: 'upload'
        }
      ]
    });
  }
}
