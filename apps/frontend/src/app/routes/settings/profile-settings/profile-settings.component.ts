import { Component, Input, OnInit } from '@angular/core';
import { IMyself, IUser } from '@core/interfaces';
import { UserService } from 'apps/frontend/src/app/services/user.service';
import { createICacheable, ICacheable } from '../../../app.interfaces';
import { MyselfService } from '../../../services/myself.service';
import { IUiForm } from '../../../ui-lib/form/form.interfaces';
import isEmail from 'validator/lib/isEmail';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  @Input() user: IMyself['user'];
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

  constructor(private userService: UserService, private myselfService: MyselfService) {}

  ngOnInit(): void {
    this.user = this.myselfService.$myself.value.user;
  }

  handleSuccessfulUpdate(event:IMyself["user"]) {
    this.myselfService.setUser(event);
  }
}
