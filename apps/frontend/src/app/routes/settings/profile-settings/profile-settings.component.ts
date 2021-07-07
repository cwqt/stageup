import { BaseAppService } from './../../../services/app.service';
import { Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';
import { ILocale, IMyself, IUser, IUserStub } from '@core/interfaces';
import { UserService } from 'apps/frontend/src/app/services/user.service';
import { createICacheable, ICacheable, SUPPORTED_LOCALES } from '../../../app.interfaces';
import { MyselfService } from '../../../services/myself.service';
import { IUiForm, UiField, UiForm } from '../../../ui-lib/form/form.interfaces';
import isEmail from 'validator/lib/isEmail';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HelperService } from '../../../services/helper.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ChangeImageComponent } from '@frontend/components/dialogs/change-image/change-image.component';
import languages from '@cospired/i18n-iso-languages';
import { ActivatedRoute } from '@angular/router';

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
    private baseAppService: BaseAppService,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.baseAppService.componentInitialising(this.route);

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
          values: new Map<string, { label: string }>(
            SUPPORTED_LOCALES.map(locale => [
              `${locale.language}-${locale.region}`,
              { label: languages.getName(locale.language, this.locale) }
            ])
          )
        })
      },
      resolvers: {
        output: async v => {
          const [language, region] = v.locale.split('-');
          const locale = SUPPORTED_LOCALES.find(locale => locale.language == language && locale.region == region);
          return await this.myselfService.updateLocale(locale);
        }
      },
      handlers: {
        changes: async () => {
          this.languageSelectForm.submit();
        },
        // On success, we want to reload the current page with the language prefixed (e.g. '/cy/settings')
        success: async v => {
          this.baseAppService.navigateTo(`/${v.language}/${this.baseAppService.getUrl()}`);
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
