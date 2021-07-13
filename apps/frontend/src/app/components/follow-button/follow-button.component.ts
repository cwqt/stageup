import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MyselfService } from '@frontend/services/myself.service';

@Component({
  selector: 'app-follow-button',
  templateUrl: './follow-button.component.html',
  styleUrls: ['./follow-button.component.css']
})
export class FollowButtonComponent implements OnInit {
  @Input() userFollowing: boolean;
  @Input() hostId: string;

  @Output() onFollowEvent = new EventEmitter();

  constructor(private myselfService: MyselfService) {}

  ngOnInit(): void {}

  followEvent(): void {
    this.userFollowing
      ? this.myselfService.unfollowHost(this.hostId).then(() => this.onFollowEvent.emit())
      : this.myselfService.followHost(this.hostId).then(() => this.onFollowEvent.emit());
    this.userFollowing = !this.userFollowing;
  }
}
