import { GdprService } from './../../../services/gdpr.service';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-general-terms',
  templateUrl: './general-terms.component.html',
  styleUrls: ['./general-terms.component.scss']
})
export class GeneralTermsComponent implements OnInit {
  documentUrl: SafeResourceUrl;
  constructor(private gdprService: GdprService, private sanitizer: DomSanitizer) {}

  async ngOnInit(): Promise<void> {
    const termsAndConditions = await this.gdprService.getLatestDocument('general_toc');
    this.documentUrl = this.pdfUrl(termsAndConditions.document_location);
  }

  pdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
