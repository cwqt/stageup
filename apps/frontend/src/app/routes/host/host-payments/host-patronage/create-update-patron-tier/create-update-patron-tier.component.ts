import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  BASE_AMOUNT_MAP,
  CurrencyCode,
  DtoCreatePatronTier,
  DtoUpdatePatronTier,
  IHostPatronTier,
  pick
} from '@core/interfaces';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { IUiDialogOptions, SecondaryButton, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-create-update-patron-tier',
  templateUrl: './create-update-patron-tier.component.html',
  styleUrls: ['./create-update-patron-tier.component.scss']
})
export class CreateUpdatePatronTierComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<IHostPatronTier> = new EventEmitter();
  cancel: EventEmitter<void> = new EventEmitter();
  buttons: IUiDialogOptions['buttons'] = [];

  tierForm: UiForm<IHostPatronTier, DtoCreatePatronTier>;
  tier: ICacheable<IHostPatronTier> = createICacheable();

  title: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { operation: 'create' | 'update'; tier: IHostPatronTier },
    private ref: MatDialogRef<CreateUpdatePatronTierComponent>,
    private toastService: ToastService,
    private hostService: HostService
  ) {}

  ngOnInit(): void {
    this.title = this.data.operation == 'update' ? $localize`Update patron tier` : $localize`Create patron tier`;

    this.tierForm = new UiForm({
      fields: {
        name: UiField.Text({
          label: $localize`Tier title`,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 32 }]
        }),
        description: UiField.Richtext({
          label: $localize`Description`,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 2048 }]
        }),
        amount: UiField.Money({
          label: $localize`Price`,
          currency: CurrencyCode.GBP,
          disabled: false,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 100 }]
        })
      },
      resolvers: {
        input: async () =>
          this.data.operation == 'update' && {
            fields: {
              name: this.data.tier?.name,
              description: this.data.tier?.description || undefined,
              amount: this.data.tier && this.data.tier.amount / BASE_AMOUNT_MAP[this.data.tier.currency]
            }
          },
        output: async v =>
          this.data.operation == 'update'
            ? this.hostService.updatePatronTier(this.hostService.hostId, this.data.tier._id, this.updateTransform(v))
            : this.hostService.createPatronTier(this.hostService.hostId, this.createTransform(v))
      },
      handlers: {
        success: async tier => {
          this.toastService.emit(
            this.data.operation == 'update'
              ? $localize`Updated patron tier: ${tier.name}!`
              : $localize`Created patron tier: ${tier.name}!`
          );
          this.submit.emit(tier);
          this.ref.close(tier);
        },
        failure: async () => this.ref.close()
      }
    });

    this.buttons = [
      new UiDialogButton({
        label: $localize`Cancel`,
        kind: SecondaryButton,
        disabled: false,
        callback: () => this.ref.close()
      }),
      new UiDialogButton({
        label: this.data.operation == 'update' ? $localize`Update` : $localize`Create`,
        kind: ThemeKind.Primary,
        disabled: true,
        callback: () => this.tierForm.submit()
      }).attach(this.tierForm)
    ];
  }

  updateTransform(v): DtoUpdatePatronTier {
    return {
      name: v.name,
      amount: v.amount * 100,
      description: v.description,
      is_visible: this.data.tier.is_visible // value set from outside this form
    };
  }

  createTransform(v): DtoCreatePatronTier {
    return {
      name: v.name,
      currency: CurrencyCode.GBP,
      amount: v.amount * 100, // TODO: support more than pence
      description: v.description
    };
  }
}
