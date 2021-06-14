import { Component, Input, OnInit } from '@angular/core';

type ShareLocations = 'facebook' | 'twitter' | 'linkedin';

@Component({
  selector: 'app-social-sharing',
  templateUrl: './social-sharing.component.html',
  styleUrls: ['./social-sharing.component.scss']
})
export class SocialSharingComponent implements OnInit {
  @Input() url: string;

  icons: { [index in ShareLocations]: string } = {
    facebook: 'logo--facebook',
    twitter: 'logo--twitter',
    linkedin: 'logo--linkedin'
  };

  callbacks: { [index in ShareLocations]: () => void };
  socials: ShareLocations[];

  constructor() {}

  ngOnInit(): void {
    this.socials = Object.keys(this.icons) as any;

    // https://jonsuh.com/blog/social-share-links/
    this.callbacks = {
      facebook: () => this.windowPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURI(this.url)}`),
      twitter: () => this.windowPopup(`https://twitter.com/intent/tweet?url=${encodeURI(this.url)}`),
      // https://stackoverflow.com/a/61583095
      linkedin: () =>
        this.windowPopup(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURI(this.url).replace('http', 'https')}`
        )
    };
  }

  windowPopup(url, width = 300, height = 500) {
    // Calculate the position of the popup so
    // it’s centered on the screen.
    var left = screen.width / 2 - width / 2,
      top = screen.height / 2 - height / 2;

    window.open(
      url,
      '',
      'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,width=' +
        width +
        ',height=' +
        height +
        ',top=' +
        top +
        ',left=' +
        left
    );
  }
}
