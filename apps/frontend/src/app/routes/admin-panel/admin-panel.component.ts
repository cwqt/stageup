import { Component, OnInit } from '@angular/core';
import { BaseAppService } from '../../services/app.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  constructor(private baseAppService: BaseAppService) {}

  ngOnInit(): void {}

  gotoOnboardingList() {
    this.baseAppService.navigateTo(`/admin/onboardings`);
  }
}
