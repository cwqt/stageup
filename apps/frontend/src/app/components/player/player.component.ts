import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AssetType, IAsset, IAssetStub, ISignedToken } from '@core/interfaces';
import { PlyrComponent } from 'ngx-plyr';
import { timeInterval } from 'rxjs/operators';
import { HlsjsPlyrDriver } from './hls-plyr-driver';
import Hls from 'hls.js';
import mux from 'mux-embed';
import { environment } from 'apps/frontend/src/environments/environment';
import { MyselfService } from '@frontend/services/myself.service';
import { AppService } from '@frontend/services/app.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {
  @ViewChild(PlyrComponent) plyr: PlyrComponent;

  @Output() onPlayerReady: EventEmitter<PlayerComponent> = new EventEmitter();
  @Output() onPlayerError: EventEmitter<Plyr.PlyrEvent> = new EventEmitter();
  @Output() onPlayerWaiting: EventEmitter<Plyr.PlyrEvent> = new EventEmitter();
  @Output() onPlayerEnded: EventEmitter<Plyr.PlyrEvent> = new EventEmitter();
  @Output() onPlayerPlay: EventEmitter<Plyr.PlyrEvent> = new EventEmitter();

  asset?: IAssetStub;
  token?: ISignedToken;

  player: Plyr;
  poster: string;
  hlsjsDriver: HlsjsPlyrDriver;
  streamSources: Plyr.Source[] = [];
  options: Plyr.Options = {
    disableContextMenu: true,
    ratio: '16:9',
    captions: { active: true, update: true, language: 'en' }
  };

  constructor(private myselfService: MyselfService, private appService: AppService) {}

  ngOnInit(): void {
    this.hlsjsDriver = new HlsjsPlyrDriver(false);
  }

  load(asset?: IAssetStub, token?: ISignedToken) {
    this.asset = asset;
    this.token = token;

    // this.setPoster();
    this.streamSources = [
      {
        provider: 'html5',
        type: 'video',
        // Useful sample stream for debugging purposes
        // src: "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
        src: this.token ? `${this.asset.location}?token=${this.token.signed_token}` : this.asset.location
      }
    ];

    const video = this.hlsjsDriver.load(this.streamSources[0].src);

    // Setup the MUX video monitor for capturing data stats (views)
    // https://docs.mux.com/guides/data/monitor-hls-js#2-initialize-mux-data
    mux.monitor(video, {
      // debug: true,
      hlsjs: this.hlsjsDriver.hls,
      Hls: Hls,
      data: {
        env_key: this.appService.environment.mux_env_key,
        player_init_time: Date.now(),
        player_name: 'player',

        // https://docs.mux.com/guides/data/make-your-data-actionable-with-metadata#high-priority-configurable-metadata
        // StageUp internal video ID
        video_id: asset._id,
        // StageUp internal user ID
        viewer_user_id: this.myselfService.$myself.value?.user?._id || 'not-logged-in'
      }
    });  

    return this.player;
  }

  setPoster() {
    const playbackId = this.asset.location.split('.m3u8').shift().split('/').pop();
    this.poster = this.token
      ? `https://image.mux.com/${playbackId}/thumbnail.jpg?token=${this.token.signed_token}`
      : `https://image.mux.com/${playbackId}/thumbnail.jpg`;
  }

  _onPlay(event: Plyr.PlyrEvent) {
    this.onPlayerPlay.emit(event);
  }

  _onPlayerInit(event: Plyr) {
    this.player = event;
    this.onPlayerReady.emit(this);
  }

  _onPlayerEvent(event: Plyr.PlyrEvent) {
    console.log('event', event);
  }

  _onLanguageChanged(driver: HlsjsPlyrDriver, plyr: Plyr) {
    setTimeout(() => (driver.hls.subtitleTrack = plyr.currentTrack), 50);
  }
}
