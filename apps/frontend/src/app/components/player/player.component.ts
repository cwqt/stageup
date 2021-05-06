import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AssetType, IAsset, IAssetStub, JwtAccessToken } from '@core/interfaces';
import { PlyrComponent } from 'ngx-plyr';
import { timeInterval } from 'rxjs/operators';
import { HlsjsPlyrDriver } from './hls-plyr-driver';

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

  asset?: IAssetStub;
  token?: string;

  player: Plyr;
  poster: string;
  hlsjsDriver: HlsjsPlyrDriver;
  streamSources: Plyr.Source[] = [];
  options: Plyr.Options = {
    disableContextMenu: true,
    ratio: '16:9',
    captions: { active: true, update: true, language: 'en' }
  };

  constructor() {}

  ngOnInit(): void {
    this.hlsjsDriver = new HlsjsPlyrDriver(false);
  }

  load(asset?: IAssetStub, token?: JwtAccessToken) {
    this.asset = asset;
    this.token = token;

    this.setPoster();
    this.streamSources = [
      {
        provider: 'html5',
        type: 'video',
        // Useful sample stream for debugging purposes
        // src: "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
        src: this.token ? `${this.asset.location}?token=${this.token}` : this.asset.location
      }
    ];

    this.hlsjsDriver.load(this.streamSources[0].src);
    return this.player;
  }

  setPoster() {
    const playbackId = this.asset.location.split('.m3u8').shift().split('/').pop();
    this.poster = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
  }

  _onPlay() {
    console.log(this.streamSources);
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
