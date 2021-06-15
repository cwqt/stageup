import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CountryCode, DtoUpdateHost, IHostBusinessDetails, IHostPrivate, IMyself } from '@core/interfaces';
import { ToastService } from '@frontend/services/toast.service';
import { MyselfService } from 'apps/frontend/src/app/services/myself.service';
import { BaseAppService } from '@frontend/services/app.service';
import { HelperService } from '@frontend/services/helper.service';
import { HostService } from '@frontend/services/host.service';
import { UiDialogButton } from '@frontend/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import isPostalCode from 'validator/es/lib/isPostalCode';
import iso3166 from 'i18n-iso-countries';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { HostDeleteDialogComponent } from '../host-delete-dialog/host-delete-dialog.component';
import { to } from '@core/helpers';
import { regexes } from '@core/helpers';

@Component({
  selector: 'app-host-settings',
  templateUrl: './host-settings.component.html',
  styleUrls: ['./host-settings.component.scss']
})
export class HostSettingsComponent implements OnInit {
  myself: IMyself;
  host: IHostPrivate;
  hostDetailsForm: UiForm<DtoUpdateHost, IHostPrivate>;

  constructor(
    private dialog: MatDialog,
    private helperService: HelperService,
    private myselfService: MyselfService,
    private hostService: HostService,
    private toastService: ToastService,
    private baseAppService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.myself = this.myselfService.$myself.getValue();

    this.hostDetailsForm = new UiForm({
      fields: {
        name: UiField.Text({ label: $localize`Company Name` }),
        email_address: UiField.Text({
          label: $localize`Company e-mail address`,
          hint: $localize`We'll use this e-mail to send notifications and updates`,
          validators: [{ type: 'email' }, { type: 'required' }]
        }),
        business_contact_number: UiField.Phone({
          label: $localize`Business Contact Number`,
          hint: $localize`Of the form 1724 123321, no leading zero`,
          disabled: true
        }),
        hmrc_company_number: UiField.Number({
          label: $localize`HMRC Company Number`,
          disabled: true,
          width: 6,
          validators: [
            { type: 'minlength', value: 8 },
            { type: 'maxlength', value: 8 }
          ]
        }),
        vat_number: UiField.Text({
          label: $localize`VAT Number`,
          hint: $localize`This is 9 or 12 numbers, sometimes with ‘GB’ at the start, like 123456789 or GB123456789`,
          width: 6,
          validators: [
            {
              type: 'pattern',
              value: regexes.vat,
              message: () => $localize`Number must be 9 or 12 digits with or without GB at the start`
            }
          ]
        }),
        business_type: UiField.Select({ label: $localize`Business Type`, values: new Map([]), width: 6 }),
        business_address: UiField.Container({
          label: $localize`Business Address`,
          fields: {
            line1: UiField.Text({
              label: $localize`Address Line 1`,
              validators: [{ type: 'required' }]
            }),
            line2: UiField.Text({
              label: $localize`Address Line 2`
            }),
            city: UiField.Text({
              label: $localize`City`,
              validators: [{ type: 'required' }]
            }),
            country: UiField.Select({
              label: $localize`Country`,
              has_search: true,
              values: Object.keys(CountryCode).reduce((acc, curr) => {
                acc.set(curr, { label: iso3166.getName(CountryCode[curr], navigator.language) });
                return acc;
              }, new Map()),
              validators: [{ type: 'required' }]
            }),
            postal_code: UiField.Text({
              label: $localize`Postcode`,
              validators: [
                { type: 'required' },
                {
                  type: 'custom',
                  value: v => isPostalCode(v.value || '', 'GB'),
                  message: () => $localize`Not a valid postal code`
                }
              ]
            })
          }
        })
      },
      resolvers: {
        input: async () => {
          this.host = await this.hostService.readDetails(this.myself.host._id);
          const host = this.host;

          return {
            fields: {
              name: host.name,
              business_contact_number:
                host.business_details?.business_contact_number &&
                parseInt(
                  parsePhoneNumberFromString(host.business_details?.business_contact_number).nationalNumber as string
                ),
              email_address: host.email_address,
              hmrc_company_number: host.business_details?.hmrc_company_number,
              vat_number: host.business_details?.vat_number,
              business_type: null,
              business_address: host.business_details?.business_address
            }
          };
        },
        output: async v => {
          const res = await this.hostService.updateHost(this.host._id, {
            name: v.name,
            email_address: v.email_address,
            business_details: to<IHostBusinessDetails>({
              hmrc_company_number: v.hmrc_company_number,
              business_contact_number: parsePhoneNumberFromString(
                `+44${v.business_contact_number}`
              ).formatInternational(),
              business_address: v.business_address
            }),
            // turn nullish into undefined
            social_info: Object.keys(this.host.social_info).reduce<any>(
              (acc, curr) => ((acc[curr] = this.host.social_info[curr] || undefined), acc),
              {}
            ),
            username: this.host.username
          });
          return res;
        }
      }
    });
  }

  openDeleteHostDialog() {
    this.helperService.showDialog(this.dialog.open(HostDeleteDialogComponent, { width: '500px' }));
  }

  openLeaveHostConfirmationDialog() {
    this.helperService.showConfirmationDialog(this.dialog, {
      title: $localize`Leave '${this.myself.host.name}'`,
      description: $localize`Are you sure you want to leave this company?`,
      buttons: [
        new UiDialogButton({
          label: $localize`Cancel`,
          kind: ThemeKind.Secondary,
          callback: r => r.close()
        }),
        new UiDialogButton({
          label: $localize`Leave Company`,
          kind: ThemeKind.Danger,
          callback: r => {
            this.hostService
              .removeMember(this.myself.host._id, this.myself.user._id)
              .then(() => this.toastService.emit($localize`Successfully left company`))
              .catch(() =>
                this.toastService.emit(
                  $localize`An error occured while trying to leave, try again later`,
                  ThemeKind.Danger
                )
              );

            this.baseAppService.navigateTo('/settings');
            r.close();
          }
        })
      ]
    });
  }
}
