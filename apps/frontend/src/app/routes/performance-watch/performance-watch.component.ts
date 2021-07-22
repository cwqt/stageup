import { HttpClient } from '@angular/common/http';
import { Component, Inject, Input, LOCALE_ID, NgZone, OnDestroy, OnInit } from '@angular/core';
import { timestamp } from '@core/helpers';
import { AssetDto, AssetType, DtoPerformance, ISignedToken, LiveStreamState } from '@core/interfaces';
import { SocialSharingComponent } from '@frontend/components/social-sharing/social-sharing.component';
import { PerformanceService } from '@frontend/services/performance.service';
import { environment } from 'apps/frontend/src/environments/environment';
import { interval, Subscription } from 'rxjs';
import { PlayerComponent } from '../../components/player/player.component';
import { MyselfService } from '../../services/myself.service';
import { SseService } from '../../services/sse.service';
import { ChipComponent } from '../../ui-lib/chip/chip.component';

const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
momentDurationFormatSetup(moment);

// narrowed type of LiveStreamState
type NarrowState =
  | 'active' // stream is in progress
  | 'complete' // steram is complete
  | 'difficulties' // stream buffering / facing connection issues
  | 'idle'; // stream is not started

@Component({
  selector: 'app-performance-watch',
  templateUrl: './performance-watch.component.html',
  styleUrls: ['./performance-watch.component.scss']
})
export class PerformanceWatchComponent implements OnInit, OnDestroy {
  @Input() token: ISignedToken;
  @Input() performance: DtoPerformance['data'];

  primaryAsset: AssetDto<AssetType.LiveStream | AssetType.Video>;
  player?: PlayerComponent;
  currentStreamState: NarrowState;
  streamEvents: Subscription;
  isHostPerformancePreview: boolean = false;
  premiereCountdown: NodeJS.Timeout;
  etaUntilLive: number; // seconds until performance goes live
  stateChipColors: { [index in NarrowState]: ChipComponent['kind'] } = {
    active: 'green',
    idle: 'gray',
    difficulties: 'red',
    complete: 'blue'
  };

  rating: number; // user rating (if they have)
  registeredView: boolean = false; // if view hit already counted

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private performanceService: PerformanceService,
    private sse: SseService,
    private myself: MyselfService,
    private zone: NgZone,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    this.primaryAsset = this.performance.assets.find(asset => asset._id == this.token.asset_id);
  }

  handlePlayerReady(player: PlayerComponent) {
    this.player = player;

    setTimeout(() => {
      if (this.primaryAsset?.type == AssetType.LiveStream) {
        const stream = this.primaryAsset as AssetDto<AssetType.LiveStream>;
        // after the player has initialised we can perform actions on the initial state of the video
        this.enactUponStreamState(stream.state);

        const currentTime = timestamp();
        if (
          // performance has already started
          stream.state == LiveStreamState.Active ||
          currentTime > this.performance.premiere_datetime
        ) {
          // TODO: handle what should happen when a stream is completed
          if (stream.state != LiveStreamState.Completed) {
            this.initialiseSSE();
          }
        } else {
          // track time until live, and update player when it goes past the premiere date
          this.etaUntilLive = this.performance.premiere_datetime - currentTime;
          this.premiereCountdown = setTimeout(this.initialiseSSE.bind(this), this.etaUntilLive);

          // update the primitive counter every second
          interval(1000).subscribe(() => this.zone.run(() => (this.etaUntilLive = this.etaUntilLive - 1)));

          // we are apart of this host & so have permissions to watch previews
          const myself = this.myself.$myself.getValue();
          this.isHostPerformancePreview = myself.host._id == this.performance.host._id;
          if (this.isHostPerformancePreview) this.initialiseSSE();
        }
      } else if (this.primaryAsset?.type == AssetType.Video) {
        this.player.load(this.primaryAsset, this.token).play();
      }
    }, 0);
  }

  handlePlayerError(event: Plyr.PlyrEvent) {
    console.log(event);
  }

  handlePlayerPlay(event: Plyr.PlyrEvent) {
    if (!this.registeredView) this.performanceService.registerView(this.performance._id, this.primaryAsset._id);

    this.registeredView = true;
  }

  initialiseSSE() {
    this.streamEvents = this.sse.getStreamEvents(this.performance._id).subscribe(event => {
      this.enactUponStreamState(event.data);
    });
  }

  async enactUponStreamState(state: LiveStreamState) {
    switch (state) {
      case LiveStreamState.Completed:
        this.currentStreamState = 'complete';
        break;

      case LiveStreamState.Connected:
      case LiveStreamState.Recording:
      case LiveStreamState.Active:
        this.currentStreamState = 'active';
        this.player.load(this.primaryAsset, this.token).play();
        break;

      case LiveStreamState.Disconnected:
        this.currentStreamState = 'difficulties';
        // TODO: this.attemptStreamReconnect();
        break;

      case LiveStreamState.Created:
      case LiveStreamState.Idle:
        this.currentStreamState = 'idle';
        break;
    }
  }

  streamIsState(stream: AssetDto<AssetType.LiveStream>, states: LiveStreamState[]) {
    return states.some(s => stream.state == s);
  }

  ngOnDestroy() {
    this.streamEvents?.unsubscribe();
    this.sse.streamEventsSource?.close();
    if (this.premiereCountdown) clearTimeout(this.premiereCountdown);
  }

  prettyDuration(duration: number): string {
    // will trim days, when < 0 days etc.
    return moment.duration(duration, 'second').format('d [days], h [hours], m [minutes] [and] s [seconds]');
  }

  async testPushState(state: NarrowState) {
    const map: { [index in NarrowState]: LiveStreamState } = {
      active: LiveStreamState.Active,
      difficulties: LiveStreamState.Disconnected,
      idle: LiveStreamState.Idle,
      complete: LiveStreamState.Completed
    };

    await this.http.get(`/api/utils/performances/${this.performance._id}/state?value=${map[state]}`).toPromise();
  }
}
