import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHostStripeInfo } from '@core/interfaces';
import { StripeService } from 'ngx-stripe';
import { cachize, createICacheable, ICacheable } from '../../../app.interfaces';
import { BaseAppService } from '../../../services/app.service';
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
  connectSuccess:undefined | boolean;

  constructor(
    private baseAppService: BaseAppService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private hostService: HostService
  ) {}

  async ngOnInit() {
    await this.baseAppService.componentInitialising(this.route);

    // Check for query param, coerce to boolean if exists
    this.connectSuccess = this.baseAppService.getQueryParam('connect-success')
      ? this.baseAppService.getQueryParam('connect-success') == 'true'
      : undefined;

    // Emit toast if QP with details of Stripe connect onboarding result
    if (this.connectSuccess !== undefined) {
      this.toastService.emit(
        this.connectSuccess ? 'Successfully connected Stripe!' : 'Error occured while connecting Stripe, try again later',
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
