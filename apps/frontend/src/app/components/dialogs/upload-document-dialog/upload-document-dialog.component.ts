import { ToastService } from '@frontend/services/toast.service';
import { GdprService } from 'apps/frontend/src/app/services/gdpr.service';
import fd from 'form-data';
import { MatHorizontalStepper } from '@angular/material/stepper';
import { UiForm, UiField } from '@frontend/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { RichText } from '@core/interfaces';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';

@Component({
  selector: 'frontend-upload-document-dialog',
  templateUrl: './upload-document-dialog.component.html',
  styleUrls: ['./upload-document-dialog.component.scss']
})
export class UploadDocumentDialogComponent implements OnInit, IUiDialogOptions {
  @ViewChild('stepper') stepper: MatHorizontalStepper;
  @ViewChild('fileSelector') fileSelector: ElementRef;

  form: UiForm<RichText>;
  title: string;
  updateSummary: RichText;

  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  selectedFile: File = null;
  allowedFileType = 'application/pdf';

  buttons: IUiDialogOptions['buttons'] = [
    new UiDialogButton({
      label: $localize`Cancel`,
      kind: ThemeKind.Secondary,
      callback: () => this.cancel.emit()
    }),
    new UiDialogButton({
      label: $localize`Upload`,
      disabled: true,
      kind: ThemeKind.Primary,
      loading: false,
      callback: () => this.uploadFile().catch(error => this.toastService.emit(error, ThemeKind.Danger))
    })
  ];

  // Get reference to the upload button from dialog buttons array
  get uploadButton() {
    return this.buttons[1];
  }

  constructor(
    private gdprService: GdprService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<UploadDocumentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { document: any }
  ) {}

  ngOnInit(): void {
    // Display the dialog title as user friendly string instead of type
    switch (this.data.document.type) {
      case 'privacy_policy':
        this.title = $localize`Privacy Policy`;
        break;
      case 'general_toc':
        this.title = $localize`Terms & Conditions`;
        break;
      case 'cookies':
        this.title = $localize`Cookies`;
    }

    this.form = new UiForm({
      fields: {
        notes: UiField.Richtext({
          label: $localize`Write some notes to summarise the key changes` // optional
        })
      },
      resolvers: {
        output: v => (this.updateSummary = v.notes)
      },
      handlers: {
        success: async () => this.stepper.next()
      }
    });
  }

  onFileSelected() {
    this.selectedFile = this.fileSelector.nativeElement.files[0];
    // Disable upload button depending on whether user selected a pdf file or not
    this.uploadButton.disabled = this.selectedFile && this.selectedFile.type == this.allowedFileType ? false : true;
  }

  async uploadFile() {
    return new Promise((resolve, reject) => {
      try {
        this.uploadButton.loading = true;
        if (typeof FileReader !== 'undefined') {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const formData: fd = new fd();
            // Combine the text and file into form data to be sent to the server
            formData.append(
              'file',
              new Blob([e.target.result], { type: this.selectedFile.type }),
              this.selectedFile.name
            );
            formData.append('summary', this.updateSummary);

            this.gdprService // Make service call
              .uploadDocument(this.data.document.type, formData)
              .then(() => {
                this.uploadButton.loading = false;
                this.submit.emit();
              })
              .catch(e => {
                this.uploadButton.loading = false;
                reject(e);
              });
          };
          reader.readAsArrayBuffer(this.selectedFile);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}
