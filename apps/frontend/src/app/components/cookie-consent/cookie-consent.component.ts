import { Component, OnInit } from '@angular/core';
import { AppService } from '@frontend/services/app.service';
import { MyselfService } from '@frontend/services/myself.service';

@Component({
  selector: 'app-cookies-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss']
})
export class CookieConsentComponent implements OnInit {
  constructor(private myselfService: MyselfService, private appService: AppService) {}

  ngOnInit(): void {}

  setAcceptance(doesAccept: boolean) {
    this.myselfService.setCookiesConsent(doesAccept);
  }

  gotoCookiesPolicy() {
    this.appService.navigateTo(`/cookies-policy`);
  }
}
