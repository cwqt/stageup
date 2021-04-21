import { Component, OnInit } from '@angular/core';
import { IHost } from '@core/interfaces';

@Component({
  selector: 'app-host-profile-feed',
  templateUrl: './host-profile-feed.component.html',
  styleUrls: ['./host-profile-feed.component.scss']
})
export class HostProfileFeedComponent implements OnInit {
  host:IHost;//injected from parent

  constructor() { }

  ngOnInit(): void {
  }

}
