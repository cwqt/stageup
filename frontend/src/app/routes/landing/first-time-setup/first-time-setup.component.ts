import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UserService } from "../../../services/user.service";
import { AuthenticationService } from "src/app/services/authentication.service";
import { MatStepper } from "@angular/material/stepper";
import { Router } from "@angular/router";

@Component({
  selector: "app-first-time-setup",
  templateUrl: "./first-time-setup.component.html",
  styleUrls: ["./first-time-setup.component.scss"],
})
export class FirstTimeSetupComponent implements OnInit {
  @ViewChild("matStepper") stepper: MatStepper;

  currentUser: any;

  isLinear = false;
  avatarImageFormGroup: FormGroup;
  userNameFormGroup: FormGroup;

  buttonText: string;
  selectedImage: string;
  hasSelectedImage: boolean;

  loading = false;
  success: boolean;
  errorMessage: string;

  fileTypeError: boolean;
  allowedFileTypes = ["jpg", "jpeg", "png"];

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthenticationService
  ) {}

  ngOnInit() {
    this.currentUser = this.userService.currentUserValue;
    this.avatarImageFormGroup = this.formBuilder.group({ avatar: [""] });
    this.userNameFormGroup = this.formBuilder.group({
      name: ["", Validators.required],
    });
    this.clearAvatar();
  }

  clearAvatar() {
    this.hasSelectedImage = false;
    this.selectedImage = "/assets/avatar_placeholder.png";
    this.buttonText = "select image";
    this.avatarImageFormGroup.reset();
  }

  //update image preview by setting src as data url
  onAvatarFileSelected() {
    const inputNode: any = document.querySelector("#file");
    if (!inputNode.files.length) return;

    let parts = inputNode.files[0].name.split(".");
    if (!this.allowedFileTypes.includes(parts[parts.length - 1])) {
      this.fileTypeError = true;
      this.hasSelectedImage = false;
      this.buttonText = "invalid file";
      this.errorMessage = `file type ${inputNode.files[0].type} not allowed`;
      return;
    }

    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fileTypeError = false;
        this.hasSelectedImage = true;
        this.errorMessage = "";
        this.buttonText = inputNode.files[0].name;
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(inputNode.files[0]);
    }
  }

  handleUploadImage() {
    const inputNode: any = document.querySelector("#file");
    if (!inputNode.files.length) return this.stepper.next();

    this.errorMessage = "";
    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.loading = true;
        const formData = new FormData();
        console.log(inputNode.files);
        formData.append(
          "avatar",
          new Blob([e.target.result], { type: inputNode.files[0].type }),
          inputNode.files[0].name
        );

        this.userService
          .changeAvatar(formData)
          .then(
            (res) => {
              this.success = true;
              this.userService.setUser(res);
              //advance stepper
              this.stepper.next();
            },
            (err) => {
              this.success = false;
              this.errorMessage =
                err.error.statusCode + ": " + err.error.message;
            }
          )
          .finally(() => {
            this.loading = false;
          });
      };

      reader.readAsArrayBuffer(inputNode.files[0]);
    }
  }

  handleSubmitName() {
    this.loading = true;

    let update = {
      name: this.userNameFormGroup.get("name").value,
      new_user: false,
    };

    this.userService
      .updateUser(update)
      .subscribe(
        (res) => {
          this.success = true;
          this.stepper.next();
        },
        (err) => {
          this.errorMessage = err;
          this.success = false;
        }
      )
      .add(() => {
        this.loading = false;
      });
  }

  finishFirstTimeSetup() {
    this.userService.updateCurrentUser();
    this.router.navigate(["/home"]);
  }
}
