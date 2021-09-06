import { Component, EventEmitter, Inject, LOCALE_ID, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import { getDonoAmount, i18n } from '@core/helpers';
import {
  AssetType,
  BASE_AMOUNT_MAP,
  DonoPeg,
  DtoPerformance,
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
import { AppService } from '@frontend/services/app.service';
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

  @Output() onLikeEvent = new EventEmitter();
  @Output() onFollowEvent = new EventEmitter();

  performanceCacheable: ICacheable<DtoPerformance> = createICacheable();
  paymentIntentSecret: ICacheable<IPaymentIntentClientSecret> = createICacheable();
  stripePaymentIntent: PaymentIntent;

  myself: IMyself['user'];
  selectedTicket: ITicketStub;

  donoPegSelectForm: UiForm;
  donoPegCacheable: ICacheable<null> = createICacheable();
  selectedDonoPeg: DonoPeg;
  performanceTrailer: IAssetStub<AssetType.Video>;

  brochureSharingUrl: SocialSharingComponent['url'];
  userFollowing: boolean;

  userLiked: boolean;
  thumbnail: IAssetStub<AssetType.Image>;

  hostMarketingOptForm: UiForm<{ does_opt_out: boolean }>;
  stageupMarketingOptForm: UiForm<{ does_opt_in: boolean }>;

  get performance() {
    return this.performanceCacheable.data?.data;
  }

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private myselfService: MyselfService,
    private performanceService: PerformanceService,
    private appService: AppService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<PerformanceBrochureComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { performance_id: string }
  ) {}

  async ngOnInit() {
    this.myself = this.myselfService.$myself.getValue()?.user;
    await cachize(this.performanceService.readPerformance(this.data.performance_id), this.performanceCacheable).then(
      d => {
        this.performanceTrailer = d.data.assets.find(a => a.type == AssetType.Video && a.tags.includes('trailer'));
        this.userFollowing = d.__client_data?.is_following;
        this.userLiked = d.__client_data?.is_liking;
        return d;
      }
    );

    // Used for social sharing component
    this.brochureSharingUrl = `${this.appService.environment.frontend_url}/?performance=${this.performance._id}`;

    // Find first thumbnail, to show on cover image if no trailer video is present
    this.thumbnail = this.performance.assets.find(a => a.type == AssetType.Image && a.tags.includes('thumbnail'));

    // Host marketing form when going to purchase a ticket
    this.hostMarketingOptForm = new UiForm({
      fields: {
        does_opt_out: UiField.Checkbox({
          label: $localize`I do not wish to recieve direct marketing from the creator of this performance, @${this.performance.host.username}`
        })
      },
      resolvers: {
        output: async v => v
      }
    });
    // StagUp marketing form when going to purchase a ticket
    this.stageupMarketingOptForm = new UiForm({
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
          hard_host_marketing_opt_out: this.hostMarketingOptForm.group.value.does_opt_out,
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

  likeEvent(value: boolean) {
    this.onLikeEvent.emit(value);
  }
}
