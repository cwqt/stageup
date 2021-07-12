import { Component, EventEmitter, Inject, LOCALE_ID, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import { getDonoAmount, i18n } from '@core/helpers';
import {
  AssetType,
  BASE_AMOUNT_MAP,
  DonoPeg,
  IAssetStub,
  IEnvelopedData,
  IMyself,
  IPaymentIntentClientSecret,
  IPerformance,
  IPerformanceStub,
  ITicketStub,
  PurchaseableType
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { PaymentMethodComponent } from '@frontend/components/payment-method/payment-method.component';
import { PlayerComponent } from '@frontend/components/player/player.component';
import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { BaseAppService } from '@frontend/services/app.service';
import { HelperService } from '@frontend/services/helper.service';
import { MyselfService } from '@frontend/services/myself.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { IUiDialogOptions } from '@frontend/ui-lib/ui-lib.interfaces';
import { PaymentIntent, StripeError } from '@stripe/stripe-js';
import { environment } from 'apps/frontend/src/environments/environment';

@Component({
  selector: 'performance-brochure',
  templateUrl: './performance-brochure.component.html',
  styleUrls: ['./performance-brochure.component.scss']
})
export class PerformanceBrochureComponent implements OnInit, IUiDialogOptions {
  @ViewChild('tabs') tabs: MatTabGroup;
  @ViewChild('paymentMethod') paymentMethod: PaymentMethodComponent;
  @ViewChild('trailer') trailerPlayer?: PlayerComponent;

  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  performanceCacheable: ICacheable<IEnvelopedData<IPerformance>> = createICacheable();
  paymentIntentSecret: ICacheable<IPaymentIntentClientSecret> = createICacheable();
  stripePaymentIntent: PaymentIntent;

  myself: IMyself['user'];
  selectedTicket: ITicketStub;

  donoPegSelectForm: UiForm;
  donoPegCacheable: ICacheable<null> = createICacheable();
  selectedDonoPeg: DonoPeg;
  performanceTrailer: IAssetStub<AssetType.Video>;

  performanceSharingUrl: SocialSharingComponent['url'];

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private myselfService: MyselfService,
    private performanceService: PerformanceService,
    private helperService: HelperService,
    private appService: BaseAppService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<PerformanceBrochureComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPerformanceStub
  ) {}

  async ngOnInit() {
    this.myself = this.myselfService.$myself.getValue()?.user;
    await cachize(this.performanceService.readPerformance(this.data._id), this.performanceCacheable).then(d => {
      this.performanceTrailer = d.data.assets.find(a => a.type == AssetType.Video && a.tags.includes('trailer'));
      return d;
    });

    this.performanceSharingUrl = `${environment.frontend_url}/${this.locale}/performances/${this.performance._id}`;
  }

  openPerformanceDescriptionSection() {
    this.selectedTicket = null;
    this.paymentIntentSecret.data = null;
    this.paymentIntentSecret.error = null;
    this.tabs.selectedIndex = 0;
  }

  openPurchaseTicketSection(selectedTicket: ITicketStub) {
    this.selectedTicket = selectedTicket;

    if (this.selectedTicket.type == 'dono') {
      this.donoPegSelectForm = new UiForm({
        fields: {
          pegs: UiField.Radio({
            label: $localize`Select a donation amount`,
            values: new Map(
              selectedTicket.dono_pegs.map(peg => [
                peg,
                {
                  label:
                    peg == 'allow_any'
                      ? $localize`Enter an amount`
                      : i18n.money(getDonoAmount(peg, selectedTicket.currency), selectedTicket.currency)
                }
              ])
            )
          })
        },
        resolvers: {
          output: async v => v
        },
        handlers: {
          changes: async v => this.updatePayButtonWithDono(v)
        }
      });

      if (selectedTicket.dono_pegs.includes('allow_any')) {
        this.donoPegSelectForm.fields.allow_any_amount = UiField.Number({
          label: $localize`Enter custom amount:`,
          hide: v => v.value.pegs !== 'allow_any',
          initial: 0
        });
      }
    } else {
      this.donoPegSelectForm = null;
    }

    this.tabs.selectedIndex = 1;
  }

  confirmTicketPayment() {
    this.paymentMethod.confirmPayment(
      this.performanceService.createTicketPaymentIntent.bind(this.performanceService),
      {
        payment_method_id: this.paymentMethod.selectionModel.selected[0]._id,
        purchaseable_type: PurchaseableType.Ticket,
        purchaseable_id: this.selectedTicket._id,
        options: {
          selected_dono_peg: this.donoPegSelectForm?.group?.value?.pegs,
          allow_any_amount: this.donoPegSelectForm?.group?.value?.allow_any_amount
        }
      },
      this.performance.host.stripe_account_id
    );
  }

  handleCardPaymentSuccess(paymentIntent: PaymentIntent) {
    this.stripePaymentIntent = paymentIntent;
    this.openPurchaseConfirmationSection();
  }

  openPurchaseConfirmationSection() {
    this.tabs.selectedIndex = 2;
  }

  handleCardPaymentFailure(error: StripeError) {
    console.error(error);
  }

  closeDialog() {
    this.dialog.closeAll();
  }

  openRegister() {
    this.appService.navigateTo(`/register`);
  }

  openLogin() {
    this.appService.navigateTo(`/login`);
  }

  updatePayButtonWithDono(event: FormGroup) {
    this.selectedDonoPeg = event.value.pegs;
    if (this.selectedDonoPeg == 'allow_any') {
      this.selectedTicket.amount = getDonoAmount(
        'allow_any',
        this.selectedTicket.currency,
        event.value.allow_any_amount * BASE_AMOUNT_MAP[this.selectedTicket.currency]
      );
    } else {
      this.selectedTicket.amount = getDonoAmount(this.selectedDonoPeg, this.selectedTicket.currency);
    }
  }
}
