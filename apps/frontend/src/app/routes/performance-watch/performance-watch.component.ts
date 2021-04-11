import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DtoPerformance, LiveStreamState, SseEventType } from '@core/interfaces';
import { Observable, Subscription } from 'rxjs';
import { timestamp } from '@core/shared/helpers';
import { PlayerComponent } from '../../components/player/player.component';
import { MyselfService } from '../../services/myself.service';
import { SseService } from '../../services/sse.service';
import { interval } from 'rxjs';
import { ChipComponent } from '../../ui-lib/chip/chip.component';
import { HttpClient } from '@angular/common/http';
import { LiveStream } from '@mux/mux-node';

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
  @Input() performance: DtoPerformance;

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

  constructor(private sse: SseService, private myself: MyselfService, private zone: NgZone, private http: HttpClient) {}

  ngOnInit(): void {
  }

  handlePlayerReady(player: PlayerComponent) {
    this.player = player;

    setTimeout(() => {
      // after the player has initialised we can perform actions on the initial state of the video
      this.enactUponStreamState(this.performance.data.stream.state);

      const currentTime = timestamp();
      if (
        // performance has already started
        this.performance.data.stream.state == LiveStreamState.Active ||
        currentTime > this.performance.data.premiere_date
      ) {
        // TODO: handle what should happen when a stream is completed
        if(this.performance.data.stream.state != LiveStreamState.Completed) {
          this.initialiseSSE();
        }
      } else {
        // track time until live, and update player when it goes past the premiere date
        this.etaUntilLive = this.performance.data.premiere_date - currentTime;
        this.premiereCountdown = setTimeout(this.initialiseSSE.bind(this), this.etaUntilLive);

        // update the primitive counter every second
        interval(1000).subscribe(() => this.zone.run(() => (this.etaUntilLive = this.etaUntilLive - 1)));

        // we are apart of this host & so have permissions to watch previews
        const myself = this.myself.$myself.getValue();
        this.isHostPerformancePreview = myself.host._id == this.performance.data.host._id;
        if(this.isHostPerformancePreview) this.initialiseSSE();
      }
    }, 0);
  }

  handlePlayerError(event:Plyr.PlyrEvent) {
    console.log(event)
  }

  initialiseSSE() {
    this.streamEvents = this.sse.getStreamEvents(this.performance.data._id).subscribe(event => {
      this.enactUponStreamState(event.data);
    });
  }

  enactUponStreamState(state: LiveStreamState) {
    switch (state) {
      case LiveStreamState.Completed:
        this.currentStreamState = 'complete';
        break;

      case LiveStreamState.Connected:
      case LiveStreamState.Recording:
      case LiveStreamState.Active:
        this.currentStreamState = 'active';
        this.player.initialise();
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

  isState(states: LiveStreamState[]) {
    return states.some(s => this.performance.data.stream.state == s);
  }

  ngOnDestroy() {
    this.streamEvents?.unsubscribe();
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

    await this.http.get(`/api/utils/performances/${this.performance.data._id}/state?value=${map[state]}`).toPromise();
  }
}
