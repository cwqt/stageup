import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { PaymentMethodComponent } from '@frontend/components/payment-method/payment-method.component';
import { MatTabGroup } from '@angular/material/tabs';
import { createICacheable, ICacheable } from '@frontend/app.interfaces';
import { BASE_AMOUNT_MAP, DonoPeg, DtoPerformance, IMyself, IPaymentIntentClientSecret, ITicketStub, LikeLocation, PurchaseableType } from '@core/interfaces';
import { PerformanceService } from '@frontend/services/performance.service';
import { getDonoAmount, i18n, timestamp, unix } from '@core/helpers';
import { PaymentIntent, StripeError } from '@stripe/stripe-js';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { AppService } from '@frontend/services/app.service';
import { FormGroup } from '@angular/forms';
import { MyselfService } from '@frontend/services/myself.service';

const moment = require('moment');

@Component({
    selector: 'performance-brochure-tabs',
    templateUrl: './performance-brochure-tabs.component.html',
    styleUrls: ['./performance-brochure-tabs.component.scss']
})
export class PerformanceBrochureTabsComponent implements OnInit {
  @ViewChild('tabs') tabs: MatTabGroup;
  @ViewChild('paymentMethod') paymentMethod: PaymentMethodComponent;
  @Input('performance') performanceCacheable: ICacheable<DtoPerformance>
  @Output() onLike = new EventEmitter();
  @Output() leave = new EventEmitter();

  _userFollowing: boolean;
  _userLiked: boolean;

  paymentIntentSecret: ICacheable<IPaymentIntentClientSecret> = createICacheable();
  stripePaymentIntent: PaymentIntent;

  myself: IMyself['user'];
  selectedTicket: ITicketStub;

  donoPegSelectForm: UiForm;
  donoPegCacheable: ICacheable<null> = createICacheable();
  selectedDonoPeg: DonoPeg;

  _hostMarketingOptForm: UiForm<{ does_opt_out: boolean }>;
  _stageupMarketingOptForm: UiForm<{ does_opt_in: boolean }>;

  _showHostMarketingForm: boolean;
  _showPlatformMarketingForm: boolean;

  currentTimestamp = timestamp();

  constructor(
    private myselfService: MyselfService,
    private performanceService: PerformanceService,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.myself = this.myselfService.$myself.getValue()?.user;
  }

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  get userFollowing() {
    if (!this._userFollowing) this._userFollowing = this.performanceCacheable.data.__client_data?.is_following;
    return this._userFollowing;
  }

  get userLiked() {
    if (!this._userLiked) this._userLiked = this.performanceCacheable.data.__client_data?.is_liking;
    return this._userLiked;
  }

  get userHasBoughtPerformance(): boolean {
    return this.performanceCacheable?.data.__client_data.has_bought_ticket_for;
  }

  get hostMarketingOptForm() {
    if (!this._hostMarketingOptForm) {
      this._hostMarketingOptForm = new UiForm({
        fields: {
          does_opt_out: UiField.Checkbox({
            label: $localize`I do not wish to recieve direct marketing from the creator of this performance, @${this.performance.host.username}`
          })
        },
        resolvers: {
          output: async v => v
        }
      });
    }
    return this._hostMarketingOptForm;
  }

  get stageupMarketingOptForm() {
    if (!this._stageupMarketingOptForm) {
      this._stageupMarketingOptForm = new UiForm({
        fields: {
          does_opt_in: UiField.Checkbox({
            label: $localize`StageUp can send me emails about the best performances happening nearby`
          })
        },
        resolvers: {
          output: async v => v
        }
      });
    }
    return this._stageupMarketingOptForm;
  }

  get showHostMarketingForm() {
    if (!this._showHostMarketingForm) {
      this._showHostMarketingForm =
      this.performanceCacheable.data.__client_data.host_marketing_opt_status === null &&
      !this.myself.is_hiding_host_marketing_prompts;
    }
    return this._showHostMarketingForm;
  }

  get showPlatformMarketingForm() {
    if (!this._showPlatformMarketingForm) {
      this._showPlatformMarketingForm =
      this.performanceCacheable.data.__client_data.platform_marketing_opt_status === null;
    }
    return this._showPlatformMarketingForm
  }

  prettyDuration(duration: number): string {
    return moment.duration(duration, 'second').humanize(true);
  }

  prettyDate(timestamp: number): string {
    return i18n.date(unix(timestamp), this.myself.locale);
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
          allow_any_amount: this.donoPegSelectForm?.group?.value?.allow_any_amount,
          // If the user was shown the form then the the opt-out is true or false. If they weren't shown the form then the opt-out is 'null'.
          hard_host_marketing_opt_out: this.showHostMarketingForm
            ? this.hostMarketingOptForm.group.value.does_opt_out
            : null,
          stageup_marketing_opt_in: this.stageupMarketingOptForm.group.value.does_opt_in
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

  likeEvent(value: boolean) {
    this.onLike.emit(value);
  }

  onFollowEvent() {

  }

  async likePerformance() {
    await this.performanceService.toggleLike(this.performance._id, LikeLocation.Brochure);
  }

  leaveEvent() {
    this.leave.emit();
  }
}
