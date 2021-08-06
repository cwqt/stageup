import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../../../services/app.service';

@Component({
  selector: 'app-verified',
  templateUrl: './verified.component.html',
  styleUrls: ['./verified.component.scss']
})
export class VerifiedComponent implements OnInit {
  public state: string;

  constructor(private route: ActivatedRoute, private appService: AppService) {}

  async ngOnInit() {
    await this.appService.componentInitialising(this.route);
    this.state = this.appService.getQueryParam('state');
  }

  gotoSupportForm() {
    //support form stub
  }
}
