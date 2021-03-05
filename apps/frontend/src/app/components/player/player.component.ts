import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DtoAccessToken, IEnvelopedData, IPerformance } from '@core/interfaces';
import { PlyrComponent } from 'ngx-plyr';
import { HlsjsPlyrDriver } from './hls-plyr-driver';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {
  @ViewChild(PlyrComponent) plyr: PlyrComponent;
  @Input() performance:IEnvelopedData<IPerformance, DtoAccessToken>;

  player: Plyr;
  videoSources: Plyr.Source[] = [];

  options: Plyr.Options = {
    captions: { active: true, update: true, language: 'en' },
  };

  hlsjsDriver = new HlsjsPlyrDriver(true);


  constructor() { }

  ngOnInit(): void {
    this.videoSources.push({
      type: "video",
      src: `https://stream.mux.com/${this.performance.data.playback_id}.m3u8?token=${this.performance.__client_data.access_token}`,
      provider: 'html5',
    })
  }

  onPlayError(event) {
    console.log(event)
  }

  onPlayerInit(event:Plyr) {
    this.player = event;
  }

  onPlayerEvent(event: Plyr.PlyrEvent) {
    console.log('event', event);
  }


  onLanguageChanged(driver: HlsjsPlyrDriver, plyr: Plyr) {
    setTimeout(() => driver.hls.subtitleTrack = plyr.currentTrack, 50);
  }}
