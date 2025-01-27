import { Component, ElementRef, EventEmitter, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { IUiDialogOptions, ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import fd from 'form-data';
import { ToastService } from '@frontend/services/toast.service';
import { HostService } from '@frontend/services/host.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';

@Component({
  selector: 'app-change-image',
  templateUrl: './change-image.component.html',
  styleUrls: ['./change-image.component.scss']
})
export class ChangeImageComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();

  @ViewChild('fileInput') inputElement: ElementRef;

  buttonText: string;
  removeButtonText: string;
  selectedImage: string;
  hasSelectedImage: boolean = false;
  errorMessage: string = '';
  fileTypeError: boolean;
  fileToUpload: File = null;

  private allowedFileTypes = ['jpg', 'jpeg', 'png'] as const;
  private reader: FileReader = new FileReader();

  hostId: string;

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
      callback: () =>
        this.handleUploadImage()
          .then(url => this.submit.emit(url))
          .catch(error => this.toastService.emit(error, ThemeKind.Danger))
    })
  ];

  constructor(
    private toastService: ToastService,
    private hostService: HostService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ChangeImageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { initialImage?: string; fileHandler: (formData: fd) => Promise<string> }
  ) {}

  async ngOnInit(): Promise<void> {
    this.hostId = this.hostService.currentHostValue._id;
    this.clearAvatar();
  }

  get uploadButton() {
    return this.buttons[1];
  }

  public clearAvatar() {
    this.hasSelectedImage = false;
    this.selectedImage = this.data.initialImage ? this.data.initialImage : '/assets/avatar-placeholder.png';
    this.buttonText = $localize`Select image`;
    this.removeButtonText = $localize`Remove image`;
    this.uploadButton.disabled = true;
  }

  private displayErrorIfFilesForbidden(inputElement: any) {
    const fileList = inputElement.files[0].name.split('.');

    if (!this.allowedFileTypes.includes(fileList[fileList.length - 1])) {
      this.uploadButton.disabled = true;
      this.fileTypeError = true;
      this.hasSelectedImage = false;
      this.buttonText = $localize`Invalid file`;
      this.errorMessage = $localize`File type ${inputElement.files[0].type} not allowed`;
    }
  }

  public onAvatarFileSelected() {
    this.uploadButton.label = $localize`Upload`;

    // Set the preview image to the uploaded file
    const inputElement = this.inputElement.nativeElement;
    this.displayErrorIfFilesForbidden(inputElement);
    if (typeof FileReader !== 'undefined') {
      this.reader.onload = (e: any) => {
        this.uploadButton.disabled = false;
        this.fileTypeError = false;
        this.hasSelectedImage = true;
        this.errorMessage = '';
        this.buttonText = inputElement.files[0].name;
        this.selectedImage = e.target.result;
      };
      this.reader.readAsDataURL(inputElement.files[0]);
    }
  }

  public handleUploadImage(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // this.cancel.emit();
        const inputElement = this.inputElement.nativeElement;
        // Read file again & upload file
        if (typeof FileReader !== 'undefined') {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.uploadButton.loading = true;
            const formData: fd = new fd();

            formData.append(
              'file',
              new Blob([e.target.result], { type: inputElement.files[0].type }),
              inputElement.files[0].name
            );

            this.uploadButton.loading = true;
            this.data
              .fileHandler(formData)
              .then(url => resolve(url))
              .catch(e => {
                reject(e);
                this.uploadButton.loading = false;
                this.clearAvatar();
              });
          };
          reader.readAsArrayBuffer(inputElement.files[0]);
        }
      } catch (error) {
        this.selectedImage = this.data.initialImage;
        reject(error);
      }
    });
  }

  public deleteAsset(event) {
    this.dialog.closeAll();
    // null body taken as delete
    this.data.fileHandler(null);
    this.submit.emit(event);
  }
}
