import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHost, IHostStripeInfo, IHostStub } from '@core/interfaces';
import { StripeService } from 'ngx-stripe';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { AppService } from '../../../services/app.service';
import { HostService } from '../../../services/host.service';
import { ToastService } from '../../../services/toast.service';
import { ThemeKind } from '../../../ui-lib/ui-lib.interfaces';

@Component({
  selector: 'app-host-payments',
  templateUrl: './host-payments.component.html',
  styleUrls: ['./host-payments.component.scss']
})
export class HostPaymentsComponent implements OnInit {
  stripeInfo: ICacheable<IHostStripeInfo> = createICacheable();
  connect: ICacheable<null> = createICacheable();
  connectSuccess: undefined | boolean;
  host: IHost;

  constructor(
    private appService: AppService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private hostService: HostService
  ) {}

  async ngOnInit() {
    this.host = this.hostService.currentHostValue;
    await this.appService.componentInitialising(this.route);

    // Check for query param, coerce to boolean if exists
    this.connectSuccess = this.appService.getQueryParam('connect-success')
      ? this.appService.getQueryParam('connect-success') == 'true'
      : undefined;

    // Emit toast if QP with details of Stripe connect onboarding result
    if (this.connectSuccess !== undefined) {
      this.toastService.emit(
        this.connectSuccess
          ? $localize`Successfully connected Stripe!`
          : $localize`Error occured while connecting Stripe, try again later`,
        this.connectSuccess ? ThemeKind.Primary : ThemeKind.Danger,
        { duration: 5000 }
      );
    }

    cachize(this.hostService.readStripeInfo(this.hostService.hostId), this.stripeInfo);
  }

  async openConnectStripe() {
    await cachize(this.hostService.connectStripe(this.hostService.hostId), this.connect).then(linkUrl =>
      window.open(linkUrl)
    );
  }
}
