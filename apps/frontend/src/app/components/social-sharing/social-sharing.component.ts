import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ShareLocations } from '@core/interfaces';
import { BaseAppService } from '@frontend/services/app.service';
//#endregion
@Component({
  selector: 'app-social-sharing',
  templateUrl: './social-sharing.component.html',
  styleUrls: ['./social-sharing.component.scss']
})
export class SocialSharingComponent implements OnInit {
  @Input() url: string;
  @Output() onLinkClick = new EventEmitter();

  icons: { [index in ShareLocations]: string } = {
    facebook: 'logo--facebook',
    twitter: 'logo--twitter',
    linkedin: 'logo--linkedin'
  };

  callbacks: { [index in ShareLocations]: () => void };
  socials: ShareLocations[];

  constructor(private baseAppService: BaseAppService) {}

  ngOnInit(): void {
    this.socials = Object.keys(this.icons) as any;

    this.callbacks = {
      facebook: () =>
        this.baseAppService.navigateToNewTab(`/redirect`, {
          queryParams: {
            redirect_to: `https://www.facebook.com/sharer/sharer.php?u=${encodeURI(this.url)}`,
            social_type: ShareLocations.Facebook
          }
        }),
      twitter: () =>
        this.baseAppService.navigateToNewTab(`/redirect`, {
          queryParams: {
            redirect_to: `https://twitter.com/intent/tweet?url=${encodeURI(this.url)}`,
            social_type: ShareLocations.Twitter
          }
        }),
      linkedin: () =>
        this.baseAppService.navigateToNewTab(`/redirect`, {
          queryParams: {
            redirect_to: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURI(this.url).replace(
              'http',
              'https'
            )}`,
            social_type: ShareLocations.Linkedin
          }
        })
    };
  }
}
