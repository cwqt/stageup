import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ActivatedRoute } from '@angular/router';
import { ILocale, IMyself } from '@core/interfaces';
import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';
import { UserService } from 'apps/frontend/src/app/services/user.service';
import isEmail from 'validator/lib/isEmail';
import { SUPPORTED_LOCALES, SUPPORTED_LOCALE_CODES } from '../../../app.interfaces';
import { HelperService } from '../../../services/helper.service';
import { MyselfService } from '../../../services/myself.service';
import { UiField, UiForm } from '../../../ui-lib/form/form.interfaces';
import { AppService } from './../../../services/app.service';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  myself: IMyself;

  profileDetailsForm: UiForm<IMyself['user']>;
  languageSelectForm: UiForm<ILocale>;

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private userService: UserService,
    private myselfService: MyselfService,
    private helperService: HelperService,
    private appService: AppService,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);

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
        output: data => this.userService.updateUser(this.myself.user._id, data),
        input: async () => ({
          fields: {
            name: this.myself.user.name,
            email_address: this.myself.user.email_address,
            bio: this.myself.user.bio
          }
        })
      },
      handlers: {
        success: async v => this.myselfService.setUser({ ...v, avatar: v.avatar || '/assets/avatar-placeholder.png' })
      }
    });

    this.languageSelectForm = new UiForm({
      fields: {
        locale: UiField.Select({
          label: $localize`Language`,
          // must use a string for the key of the selection ui
          initial: `${this.myself.user.locale.language}-${this.myself.user.locale.region}`,
          values: new Map<SUPPORTED_LOCALE_CODES, { label: string }>([
            ['en-GB', { label: 'English' }],
            ['cy-GB', { label: 'Cymraeg' }],
            ['nb-NO', { label: 'Norsk (Bokmål)' }]
          ])
        })
      },
      resolvers: {
        output: async v => {
          const { language, region } = SUPPORTED_LOCALES.find(locale => v.locale == locale.code);
          return await this.myselfService.updateLocale({ language, region });
        }
      },
      handlers: {
        changes: async () => {
          this.languageSelectForm.submit();
        },
        // On success, we want to reload the current page with the language prefixed (e.g. '/cy/settings')
        success: async v => {
          this.appService.navigateTo(`/${v.language}/${this.appService.getUrl()}`);
        }
      }
    });
  }

  openChangeAvatarDialog() {
    this.helperService.showDialog(
      this.dialog.open(ChangeImageComponent, {
        data: {
          fileHandler: async (fd: FormData) => this.userService.changeAvatar(this.myself.user._id, fd)
        }
      }),
      url => {
        this.myself.user.avatar = url || '/assets/avatar-placeholder.png';
        this.myselfService.setUser({ ...this.myselfService.$myself.getValue().user, avatar: this.myself.user.avatar });
      }
    );
  }

  updateLandingPage(event: MatSlideToggleChange) {
    this.myselfService.updatePreferredLandingPage({ prefers_dashboard_landing: event.checked });
    this.myself.host_info.prefers_dashboard_landing = event.checked;
  }
}
