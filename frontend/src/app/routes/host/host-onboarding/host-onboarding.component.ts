import { Component, Input, OnInit } from '@angular/core';
import { IHost } from '@eventi/interfaces';

@Component({
  selector: 'app-host-onboarding',
  templateUrl: './host-onboarding.component.html',
  styleUrls: ['./host-onboarding.component.scss']
})
export class HostOnboardingComponent implements OnInit {
  @Input() host:IHost

  constructor() { }

  ngOnInit(): void {
  }

}
