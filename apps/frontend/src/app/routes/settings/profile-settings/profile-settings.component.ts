import { Component, Input, OnInit } from '@angular/core';
import { IMyself, IUser, IUserStub } from '@core/interfaces';
import { UserService } from 'apps/frontend/src/app/services/user.service';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { MyselfService } from '../../../services/myself.service';
import { IUiForm } from '../../../ui-lib/form/form.interfaces';
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
  myself:IMyself;
  get user() { return this.myself.user; }

  userCacheable: ICacheable<IMyself['user']> = createICacheable();
  profileDetailsForm: IUiForm<IMyself['user']> = {
    prefetch: async () => {
      return {
        fields: {
          name: this.user.name,
          email_address: this.user.email_address,
          bio: this.user.bio
        }
      }
    },
    fields: {
      name: {
        label: 'Name',
        type: 'text',
        hint:
          'Your name may appear around StageUp where you contribute or are mentioned. You can remove it at any time.'
      },
      email_address: {
        label: 'E-mail address',
        type: 'text',
        validators: [
          { type: 'required' },
          {
            type: 'custom',
            value: v => isEmail(v.value),
            message: v => "Must provide a valid e-mail address"
          }]
      },
      bio: {
        label: 'Bio',
        type: 'textarea'
      }
    },
    submit: {
      text: 'Update profile',
      variant: 'primary',
      handler: data => this.userService.updateUser(this.user._id, data)
    }
  };

  constructor(private userService: UserService,
    private myselfService: MyselfService,
    private helperService: HelperService,
    public dialog: MatDialog) {}

  ngOnInit(): void {
    this.myself = this.myselfService.$myself.getValue();
  }

  handleSuccessfulUpdate(event:IMyself["user"]) {
    this.myselfService.setUser(event);
  }

  openChangeAvatarDialog(){
    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, { data: { fileHandler: this.handleUploadHostAvatar.bind(this) } }),
      (event: IUserStub) => {
        this.user.avatar = event.avatar;
        this.myselfService.setUser({...this.myselfService.$myself.getValue().user, avatar: event.avatar });
      });
  }

  handleUploadHostAvatar(formData:fd) {
    return this.userService.changeAvatar(this.user._id, formData);
  }

  updateLandingPage(event:MatSlideToggleChange) {
    this.myselfService.updatePreferredLandingPage({ prefers_dashboard_landing: event.checked });
    this.myself.host_info.prefers_dashboard_landing = event.checked;
  }
}
