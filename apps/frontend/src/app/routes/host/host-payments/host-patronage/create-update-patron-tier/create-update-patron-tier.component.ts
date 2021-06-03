import { Component, EventEmitter, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { stringifyRichText } from '@core/helpers';
import { CurrencyCode, DtoCreatePatronTier, IPatronTier } from '@core/interfaces';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-create-update-patron-tier',
  templateUrl: './create-update-patron-tier.component.html',
  styleUrls: ['./create-update-patron-tier.component.scss']
})
export class CreateUpdatePatronTierComponent implements OnInit, IUiDialogOptions {
  submit: EventEmitter<IPatronTier> = new EventEmitter();
  cancel: EventEmitter<void> = new EventEmitter();
  buttons: IUiDialogOptions['buttons'] = [];

  tierForm: UiForm<IPatronTier, DtoCreatePatronTier>;
  tier: ICacheable<IPatronTier> = createICacheable();

  title: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { operation: 'create' | 'update'; tier: IPatronTier },
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
        output: async v => this.hostService.createPatronTier(this.hostService.hostId, this.transform(v))
      },
      handlers: {
        success: async tier => {
          this.toastService.emit(
            this.data.operation == 'update'
              ? $localize`Created patron tier: ${tier.name}!`
              : $localize`Updated patron tier: ${tier.name}!`
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
        kind: ThemeKind.Secondary,
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

  transform(v): DtoCreatePatronTier {
    return {
      name: v.name,
      currency: CurrencyCode.GBP,
      amount: v.amount * 100, // TODO: support more than pence
      description: v.description
    };
  }
}
