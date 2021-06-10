import { Component, Input, OnInit } from '@angular/core';
import { IMyself, IUser, IUserStub } from '@core/interfaces';
import { UserService } from 'apps/frontend/src/app/services/user.service';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { MyselfService } from '../../../services/myself.service';
import { IUiForm, UiField, UiForm } from '../../../ui-lib/form/form.interfaces';
import isEmail from 'validator/lib/isEmail';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HelperService } from '../../../services/helper.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';

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
          label: $localize`Name`,
          hint: $localize`Your name may appear around StageUp where you contribute or are mentioned.`,
          validators: [{ type: 'maxlength', value: 32 }]
        }),
        email_address: UiField.Text({
          label: $localize`E-mail address`,
          validators: [
            { type: 'required' },
            {
              type: 'custom',
              value: v => isEmail(v.value),
              message: () => $localize`Must provide a valid e-mail address`
            }
          ]
        }),
        bio: UiField.Textarea({
          label: $localize`Bio`,
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
      this.dialog.open(ChangeImageComponent, {
        data: {
          fileHandler: async (fd: FormData) => this.userService.changeAvatar(this.user._id, fd)
        }
      }),
      url => {
        this.user.avatar = url || '/assets/avatar-placeholder.png';
        this.myselfService.setUser({ ...this.myselfService.$myself.getValue().user, avatar: this.user.avatar });
      }
    );
  }

  updateLandingPage(event: MatSlideToggleChange) {
    this.myselfService.updatePreferredLandingPage({ prefers_dashboard_landing: event.checked });
    this.myself.host_info.prefers_dashboard_landing = event.checked;
  }
}
