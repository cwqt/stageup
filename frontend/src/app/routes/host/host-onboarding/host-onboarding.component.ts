import { Component, Input, OnInit } from '@angular/core';
import { IHost, IHostOnboarding } from '@eventi/interfaces';
import { ICacheable } from 'src/app/app.interfaces';
import { HostService } from 'src/app/services/host.service';

@Component({
  selector: 'app-host-onboarding',
  templateUrl: './host-onboarding.component.html',
  styleUrls: ['./host-onboarding.component.scss']
})
export class HostOnboardingComponent implements OnInit {
  @Input() host:IHost

  onboarding:ICacheable<IHostOnboarding> = {
    data: null,
    loading: false,
    error: "",
  }

  constructor(private hostService:HostService) { }

  ngOnInit(): void {
  }

  async getOnboarding() {
    this.onboarding.loading = true;
    return this.hostService.readOnboardingProcessStatus(this.host._id)
      .then(o => this.onboarding.data = o)
      .catch(e => this.onboarding.error = e.message)
      .finally(() => this.onboarding.loading = false);
  }
}
