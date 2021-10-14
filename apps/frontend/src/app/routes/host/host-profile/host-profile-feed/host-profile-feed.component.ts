import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { IHost } from '@core/interfaces';

@Component({
  selector: 'app-host-profile-feed',
  templateUrl: './host-profile-feed.component.html',
  styleUrls: ['./host-profile-feed.component.scss']
})
export class HostProfileFeedComponent implements OnInit {
  host: IHost; //injected from parent

  constructor(public route: ActivatedRoute) {}

  // TODO: Probably worth having more robust check, even with server side validation
  // since regular users may end on this page (e.g. if a host shares their profile)
  // In addition, will we need to account for hosts having the same username?
  get isHostView(): boolean {
    return this.route.snapshot.data['is_host_view'];
  }

  ngOnInit(): void {}
}
