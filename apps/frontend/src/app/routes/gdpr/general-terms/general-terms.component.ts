import { GdprService } from './../../../services/gdpr.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-general-terms',
  templateUrl: './general-terms.component.html',
  styleUrls: ['./general-terms.component.scss']
})
export class GeneralTermsComponent implements OnInit {
  constructor(private gdprService: GdprService) {}

  async ngOnInit(): Promise<void> {
    const termsAndConditions = await this.gdprService.getLatestDocument('general_toc');
    console.log('termsAndConditions', termsAndConditions);
  }
}
