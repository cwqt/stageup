import { ThemeKind } from '@frontend/ui-lib/ui-lib.interfaces';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ShareLocations } from '@core/interfaces';
import { AppService } from '@frontend/services/app.service';
//#endregion
@Component({
  selector: 'app-social-sharing',
  templateUrl: './social-sharing.component.html',
  styleUrls: ['./social-sharing.component.scss']
})
export class SocialSharingComponent implements OnInit {
  @Input() url: string;
  @Output() onLinkClick = new EventEmitter();
  @Input() kind?: ThemeKind.Accent | ThemeKind.Primary = ThemeKind.Accent;

  icons: { [index in ShareLocations]: string } = {
    facebook: 'logo--facebook',
    twitter: 'logo--twitter',
    linkedin: 'logo--linkedin'
  };

  callbacks: { [index in ShareLocations]: () => void };
  socials: ShareLocations[];

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this.socials = Object.keys(this.icons) as any;

    this.callbacks = {
      facebook: () =>
        this.appService.navigateToNewTab(`/redirect`, {
          queryParams: {
            redirect_to: `https://www.facebook.com/sharer/sharer.php?u=${encodeURI(this.url)}`,
            social_type: ShareLocations.Facebook
          }
        }),
      twitter: () =>
        this.appService.navigateToNewTab(`/redirect`, {
          queryParams: {
            redirect_to: `https://twitter.com/intent/tweet?url=${encodeURI(this.url)}`,
            social_type: ShareLocations.Twitter
          }
        }),
      linkedin: () =>
        this.appService.navigateToNewTab(`/redirect`, {
          queryParams: {
            redirect_to: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURI(this.url)}`,
            social_type: ShareLocations.Linkedin
          }
        })
    };
  }
}
