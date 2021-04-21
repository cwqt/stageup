import { Component, OnInit } from '@angular/core';
import { IHost } from '@core/interfaces';

@Component({
  selector: 'app-host-profile-about',
  templateUrl: './host-profile-about.component.html',
  styleUrls: ['./host-profile-about.component.scss']
})
export class HostProfileAboutComponent implements OnInit {
  host:IHost;//injected from parent

  constructor() { }

  ngOnInit(): void {
  }

}
