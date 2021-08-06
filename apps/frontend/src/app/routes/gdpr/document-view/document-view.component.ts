import { first } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { GdprService } from './../../../services/gdpr.service';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-document-view',
  templateUrl: './document-view.component.html',
  styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnInit {
  documentUrl: SafeResourceUrl;
  error: boolean; // Added as fail safe
  
  constructor(private gdprService: GdprService, private sanitizer: DomSanitizer, public route: ActivatedRoute, public router: Router) {}

  async ngOnInit(): Promise<void> {
    const documentType = this.route.snapshot.data.document_type;
    const document = await this.gdprService.getLatestDocument(documentType);
    
    document?.document_location ? this.documentUrl = this.pdfUrl(document.document_location) : this.error = true;
  }

  pdfUrl(url: string): SafeResourceUrl { // #view=fitH makes it responsive. If we would like to also include sidebars/toolbars then delete all text after '#view=fitH'
    return this.sanitizer.bypassSecurityTrustResourceUrl(url+'#view=fitH&toolbar=0&navpanes=0&scrollbar=0');
  }
}
