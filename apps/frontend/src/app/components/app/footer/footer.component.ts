import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  constructor() {}

  socials: Array<{ icon: string; url: string }> = [
    { icon: 'logo--facebook', url: 'https://www.facebook.com/stageuphq/' },
    { icon: 'logo--instagram', url: 'https://www.instagram.com/stageuphq/' },
    { icon: 'logo--linkedin', url: 'https://www.linkedin.com/company/stageuphq/' },
    { icon: 'logo--twitter', url: 'https://twitter.com/stageuphq' },
    { icon: 'logo--youtube', url: 'https://www.youtube.com/channel/UCuce5yZWG__EhGIxeLMqJAQ' }
  ];

  ngOnInit(): void {}

  openSocial(url: string) {
    window.open(url, '_blank');
  }
}
