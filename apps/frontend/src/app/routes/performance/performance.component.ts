import { Component, Inject, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { findAssets } from '@core/helpers';
import {
  DtoAccessToken,
  DtoPerformance,
  IAssetStub,
  IEnvelopedData,
  IPerformance,
  IPerformanceUserInfo,
  AssetType,
  ISignedToken
} from '@core/interfaces';
import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { Cacheable } from 'apps/frontend/src/app/app.interfaces';
import { AppService, RouteParam } from 'apps/frontend/src/app/services/app.service';
import { PerformanceService } from 'apps/frontend/src/app/services/performance.service';
import { environment } from 'apps/frontend/src/environments/environment';
import { merge, Observable } from 'rxjs';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit {
  loading: boolean; // performance & token
  performanceCacheable: Cacheable<DtoPerformance> = new Cacheable();
  primaryAsset: IAssetStub<AssetType.Video | AssetType.LiveStream>;
  primarySignedToken: Cacheable<ISignedToken> = new Cacheable();

  performanceSharingUrl: SocialSharingComponent['url'];
  rating: number; // user rating (if they have)

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private performanceService: PerformanceService,
    private route: ActivatedRoute,
    private appService: AppService
  ) {}

  get performance(): DtoPerformance['data'] {
    return this.performanceCacheable.data?.data;
  }

  get token(): ISignedToken {
    return this.primarySignedToken.data;
  }

  async ngOnInit() {
    this.loading = true;
    await this.appService.componentInitialising(this.route);

    await this.performanceCacheable.request(
      this.performanceService.readPerformance(this.appService.getParam(RouteParam.PerformanceId))
    );

    if (this.performance) {
      this.rating = this.performanceCacheable.data.__client_data.rating;
      this.performanceSharingUrl = `${this.appService.environment.frontend_url}/${this.locale}/performances/${this.performance._id}`;

      this.primaryAsset = findAssets(
        this.performance.assets,
        [AssetType.Video, AssetType.LiveStream],
        ['primary']
      )[0];

      if (this.primaryAsset)
        await this.primarySignedToken.request(
          this.performanceService.generateSignedToken(this.performance._id, this.primaryAsset._id)
        );
    }

    this.loading = false;
  }

  gotoFeed() {
    this.appService.navigateTo(`/`);
  }

  // If user clicks on the same rating, it will remove it. Else it adds/updates it
  onRatingChanged(rateValue: number): void {
    if (this.rating === rateValue) {
      this.rating = null;
      this.performanceService.deleteRating(this.performance._id);
    } else {
      this.rating = rateValue;
      this.performanceService.setRating(this.performance._id, rateValue);
    }
  }
}
