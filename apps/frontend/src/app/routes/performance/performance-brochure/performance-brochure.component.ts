import { Component, EventEmitter, Inject, LOCALE_ID, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import { findAssets, getDonoAmount, i18n, timestamp, unix } from '@core/helpers';
import {
  AssetType,
  BASE_AMOUNT_MAP,
  DonoPeg,
  DtoPerformance,
  IAssetStub,
  IMyself,
  IPaymentIntentClientSecret,
  ITicketStub,
  LikeLocation,
  PurchaseableType
} from '@core/interfaces';
import { cachize, createICacheable, ICacheable } from '@frontend/app.interfaces';
import { PaymentMethodComponent } from '@frontend/components/payment-method/payment-method.component';
import { PlayerComponent } from '@frontend/components/player/player.component';
import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { AppService } from '@frontend/services/app.service';
import { MyselfService } from '@frontend/services/myself.service';
import { PerformanceService } from '@frontend/services/performance.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { IUiDialogOptions } from '@frontend/ui-lib/ui-lib.interfaces';
import { PaymentIntent, StripeError } from '@stripe/stripe-js';
import { PerformanceBrochureBannerComponent } from './performance-brochure-banner/performance-brochure-banner.component';
import { PerformanceBrochureTabsComponent } from './performance-brochure-tabs/performance-brochure-tabs.component';

const moment = require('moment');

@Component({
  selector: 'performance-brochure',
  templateUrl: './performance-brochure.component.html',
  styleUrls: ['./performance-brochure.component.scss']
})
export class PerformanceBrochureComponent implements OnInit, IUiDialogOptions {
  @ViewChild('banner') performanceBrochureBanner: PerformanceBrochureBannerComponent;
  @ViewChild('tabs') performanceBrochureTabs: PerformanceBrochureTabsComponent;

  @Output() submit = new EventEmitter();
  @Output() cancel = new EventEmitter();

  @Output() onLike = new EventEmitter();
  @Output() onFollowEvent = new EventEmitter();

  performanceCacheable: ICacheable<DtoPerformance> = createICacheable();
  paymentIntentSecret: ICacheable<IPaymentIntentClientSecret> = createICacheable();
  stripePaymentIntent: PaymentIntent;

  myself: IMyself['user'];
  selectedTicket: ITicketStub;

  donoPegSelectForm: UiForm;
  donoPegCacheable: ICacheable<null> = createICacheable();
  selectedDonoPeg: DonoPeg;
  // performanceTrailer: IAssetStub<AssetType.Video>;

  brochureSharingUrl: SocialSharingComponent['url'];
  userFollowing: boolean;
  userLiked: boolean;

  thumbnail: IAssetStub<AssetType.Image>;

  hostMarketingOptForm: UiForm<{ does_opt_out: boolean }>;
  stageupMarketingOptForm: UiForm<{ does_opt_in: boolean }>;

  showHostMarketingForm: boolean;
  showPlatformMarketingForm: boolean;

  // performanceStartDate: string;
  // timeUntilPerformance: string;

  currentTimestamp = timestamp();

  get performance() {
    // console.log('this is the data/performance');
    // console.log(this.performanceCacheable.data?.data);
    return this.performanceCacheable.data?.data;
  }

  get userHasBoughtPerformance(): boolean {
    return this.performanceCacheable?.data.__client_data.has_bought_ticket_for;
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
        // this.performanceTrailer = findAssets(d.data.assets, AssetType.Video, ['trailer'])[0];
        this.userFollowing = d.__client_data?.is_following;
        this.userLiked = d.__client_data?.is_liking;
        return d;
      }
    );

    // Used for social sharing component
    this.brochureSharingUrl = `${this.appService.environment.frontend_url}/?performance=${this.performance._id}`;

    // Find first thumbnail, to show on cover image if no trailer video is present
    this.thumbnail = findAssets(this.performance.assets, AssetType.Image, ['thumbnail', 'primary'])[0];

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

    // Reduce long, recurring, boolean expressions into variables
    this.showHostMarketingForm =
      this.performanceCacheable.data.__client_data.host_marketing_opt_status === null &&
      !this.myself.is_hiding_host_marketing_prompts;
    this.showPlatformMarketingForm =
      this.performanceCacheable.data.__client_data.platform_marketing_opt_status === null;
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

  async likePerformance() {
    await this.performanceService.toggleLike(this.data.performance_id, LikeLocation.Brochure);
  }

  likeEvent(value: boolean) {
    this.onLike.emit(value);
  }
}
