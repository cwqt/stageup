import { Component, Input, OnInit } from '@angular/core';
import { IMyself, IUser, IUserStub } from '@core/interfaces';
import { UserService } from 'apps/frontend/src/app/services/user.service';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { MyselfService } from '../../../services/myself.service';
import { IUiForm, UiField, UiForm } from '../../../ui-lib/form/form.interfaces';
import isEmail from 'validator/lib/isEmail';
import { ChangeImageComponent } from '../change-image/change-image.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HelperService } from '../../../services/helper.service';
import * as fd from 'form-data';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  myself: IMyself;
  get user() {
    return this.myself.user;
  }

  profileDetailsForm: UiForm<IMyself['user']>;

  constructor(
    private userService: UserService,
    private myselfService: MyselfService,
    private helperService: HelperService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.myself = this.myselfService.$myself.getValue();
    this.profileDetailsForm = new UiForm({
      fields: {
        name: UiField.Text({
          label: 'Name',
          hint:
            'Your name may appear around StageUp where you contribute or are mentioned. You can remove it at any time.',
          validators: [{ type: 'maxlength', value: 32 }]
        }),
        email_address: UiField.Text({
          label: 'E-mail address',
          validators: [
            { type: 'required' },
            {
              type: 'custom',
              value: v => isEmail(v.value),
              message: () => 'Must provide a valid e-mail address'
            }
          ]
        }),
        bio: UiField.Textarea({
          label: 'Bio',
          validators: [{ type: 'maxlength', value: 512 }]
        })
      },
      resolvers: {
        output: data => this.userService.updateUser(this.user._id, data),
        input: async () => ({
          fields: {
            name: this.user.name,
            email_address: this.user.email_address,
            bio: this.user.bio
          }
        })
      },
      handlers: {
        success: async v => this.myselfService.setUser({ ...v, avatar: v.avatar || '/assets/avatar-placeholder.png' })
      }
    });
  }

  openChangeAvatarDialog() {
    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, { data: { fileHandler: this.handleUploadHostAvatar.bind(this) } }),
      (event: IUserStub) => {
        this.user.avatar = event.avatar || '/assets/avatar-placeholder.png';
        this.myselfService.setUser({ ...this.myselfService.$myself.getValue().user, avatar: this.user.avatar });
      }
    );
  }

  handleUploadHostAvatar(formData: fd) {
    return this.userService.changeAvatar(this.user._id, formData);
  }

  updateLandingPage(event: MatSlideToggleChange) {
    this.myselfService.updatePreferredLandingPage({ prefers_dashboard_landing: event.checked });
    this.myself.host_info.prefers_dashboard_landing = event.checked;
  }
}
