import { Component, EventEmitter, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { capitalize, CurrencyCode, DtoCreatePatreonTier, DtoCreateTicket, IPatronTier, ITicket, ITicketStub } from '@core/interfaces';
import { createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { FormComponent } from 'apps/frontend/src/app/ui-lib/form/form.component';
import { IUiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';
import { IUiDialogOptions, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-create-update-patron-tier',
  templateUrl: './create-update-patron-tier.component.html',
  styleUrls: ['./create-update-patron-tier.component.scss']
})
export class CreateUpdatePatronTierComponent implements OnInit, IUiDialogOptions {
  @ViewChild('form') form: FormComponent;
  submit: EventEmitter<ITicketStub> = new EventEmitter();
  cancel: EventEmitter<void> = new EventEmitter();
  buttons: IUiDialogOptions['buttons'] = [];

  tierForm: IUiForm<IPatronTier, DtoCreatePatreonTier>;
  tier: ICacheable<IPatronTier> = createICacheable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { operation: 'create' | 'update'; tier: IPatronTier },
    private ref: MatDialogRef<CreateUpdatePatronTierComponent>,
    private toastService: ToastService,
    private hostService: HostService,
    private baseAppService: BaseAppService
  ) {}

  ngOnInit(): void {
    this.tierForm = {
      // TODO: handle updating the tier
      // prefetch: async () => {
      //   if (this.data.operation == 'update') {
      //     const data = await this.performanceService.readTicket(
      //       this.baseAppService.getParam(RouteParam.PerformanceId),
      //       this.data.ticketId
      //     );

      //     return {
      //       fields:
      //     };
      //   }
      // },
      fields: {
        name: {
          type: 'text',
          label: 'Tier title',
          validators: [{ type: 'required' }]
        },
        description: {
          type: 'rich-text',
          label: 'Description',
          validators: [{ type: 'required' }]
        },
        amount: {
          type: 'number',
          label: 'Price',
          disabled: false,
          validators: [{ type: 'required' }, { type: 'maxlength', value: 100 }]
        }
      },
      submit: {
        is_hidden: true,
        text: capitalize(this.data.operation),
        variant: 'primary',
        handler: async v => this.hostService.createPatreonTier(this.hostService.hostId, v),
        // TODO: handle updating tier
        // this.data.operation == 'create'
        //   ? this.hostService.createPatreonTier(this.baseAppService.getParam(RouteParam.PerformanceId), v)
        //   : this.hostService.updateTicket(
        //       this.baseAppService.getParam(RouteParam.PerformanceId),
        //       this.data.tier._id,
        //       v
        //     ),
        transformer: v => (console.log(v), {
          name: v.name,
          currency: CurrencyCode.GBP,
          amount: v.amount * 100, // TODO: support more than pence
          description: JSON.parse(v.description).ops
        })
      }
    };

    this.buttons = [
      {
        text: 'Cancel',
        kind: ThemeKind.Secondary,
        disabled: false,
        callback: () => this.ref.close()
      },
      {
        text: capitalize(this.data.operation),
        kind: ThemeKind.Primary,
        disabled: true,
        callback: () => this.form.onSubmit()
      }
    ];
  }

  handleFormSuccess(event: ITicket) {
    this.toastService.emit(`${capitalize(this.data.operation)}d patreon tier: ${event.name}!`);
    this.submit.emit(event);
    this.ref.close(event);
  }

  handleFormFailure() {
    this.ref.close(null);
  }

  handleFormChange(event: FormGroup) {

    this.buttons[1].disabled = !event.valid;
  }
}
