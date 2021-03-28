import { Component, ElementRef, EventEmitter, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IUiDialogOptions, ThemeKind } from '../../../ui-lib/ui-lib.interfaces';
import fd from 'form-data';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-change-image',
  templateUrl: './change-image.component.html',
  styleUrls: ['./change-image.component.css']
})
export class ChangeImageComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<string> = new EventEmitter();
  cancel: EventEmitter<string> = new EventEmitter();

  @ViewChild('fileInput') inputElement: ElementRef;

  public buttonText: string;
  public selectedImage: string;
  public hasSelectedImage: boolean = false;
  public errorMessage: string = '';
  public fileTypeError: boolean;

  private allowedFileTypes = ['jpg', 'jpeg', 'png'];
  private reader: FileReader = new FileReader();

  buttons: IUiDialogOptions['buttons'] = [
    {
      text: 'Cancel',
      kind: ThemeKind.Secondary,
      callback: () => this.cancel.emit()
    },
    {
      text: 'Upload',
      disabled: true,
      kind: ThemeKind.Primary,
      loading: false,
      callback: () => this.handleUploadImage()
        .then(url => this.submit.emit(url))
        .catch(error => this.toastService.emit(error, ThemeKind.Danger))
    }
  ];

  constructor(
    private toastService:ToastService,
    public dialogRef: MatDialogRef<ChangeImageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fileHandler: (formData: fd) => Promise<string> }
  ) {}

  async ngOnInit(): Promise<void> {
    this.clearAvatar();
  }

  get uploadButton() {
    return this.buttons[1];
  }

  public clearAvatar() {
    this.hasSelectedImage = false;
    this.selectedImage = '/assets/avatar_placeholder.png';
    this.buttonText = 'Select image';
    this.uploadButton.disabled = true;
  }

  private displayErrorIfFilesForbidden(inputElement: any) {
    const fileList = inputElement.files[0].name.split('.');

    if (!this.allowedFileTypes.includes(fileList[fileList.length - 1])) {
      this.uploadButton.disabled = true;
      this.fileTypeError = true;
      this.hasSelectedImage = false;
      this.buttonText = 'invalid file';
      this.errorMessage = `file type ${inputElement.files[0].type} not allowed`;
    }
  }

  public onAvatarFileSelected() {
    this.uploadButton.text = 'Upload';

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
            this.data.fileHandler(formData)
              .then(url => resolve(url))
              .catch(e => reject(e));
          };

          reader.readAsArrayBuffer(inputElement.files[0]);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}
