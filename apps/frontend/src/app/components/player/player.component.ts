import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DtoAccessToken, DtoPerformance, IEnvelopedData, IPerformance, JwtAccessToken } from '@core/interfaces';
import { timestamp, timeout } from '@core/shared/helpers';
import { environment } from 'apps/frontend/src/environments/environment';
import { PlyrComponent } from 'ngx-plyr';
import { HlsjsPlyrDriver } from './hls-plyr-driver';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {
  @ViewChild(PlyrComponent) plyr: PlyrComponent;
  @Input() performance: DtoPerformance;

  @Output() onPlayerReady:EventEmitter<PlayerComponent> = new EventEmitter();
  @Output() onPlayerError:EventEmitter<Plyr.PlyrEvent> = new EventEmitter();
  @Output() onPlayerWaiting:EventEmitter<Plyr.PlyrEvent> = new EventEmitter();
  @Output() onPlayerEnded:EventEmitter<Plyr.PlyrEvent> = new EventEmitter();

  player: Plyr;
  streamSources: Plyr.Source[] = [];
  options: Plyr.Options = {
    disableContextMenu: true,
    ratio: '16:9',
    captions: { active: true, update: true, language: 'en' }
  };
  hlsjsDriver: HlsjsPlyrDriver;
  playerMessage: string;

  constructor() {}

  ngOnInit(): void {
    this.hlsjsDriver = new HlsjsPlyrDriver(false);
  }

  /**
   * @description Sets up the HLS driver to the video & starts playing
   */
  async initialise() {
    this.streamSources.push({
      type: 'video',
      // Useful sample stream for debugging purposes
      // src: "https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8",
      src: `${this.performance.data.stream.location}?token=${this.performance.__client_data.token}`,
      provider: 'html5'
    });

    this.hlsjsDriver.load(this.streamSources[0].src);
    this.player.play();
    console.log("played!")
  }

  _onPlay() {
    this.initialise();
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
