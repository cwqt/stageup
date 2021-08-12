import { Component, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  constructor(private appService: AppService) {}

  ngOnInit(): void {}

  gotoOnboardingList() {
    this.appService.navigateTo(`/admin/onboardings`);
  }
}
