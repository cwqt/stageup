import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseAppService } from '../../../services/app.service';

@Component({
  selector: 'app-verified',
  templateUrl: './verified.component.html',
  styleUrls: ['./verified.component.scss']
})
export class VerifiedComponent implements OnInit {
  public state: string;

  constructor(private route: ActivatedRoute, private baseAppService: BaseAppService) {}

  async ngOnInit() {
    await this.baseAppService.componentInitialising(this.route);
    this.state = this.baseAppService.getQueryParam('state');
  }

  gotoSupportForm() {
    //support form stub
  }
}
