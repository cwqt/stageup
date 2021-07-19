import { Component, OnInit, Testability } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IRedirectData, ShareLocations } from '@core/interfaces';
import { BaseAppService, RouteParam } from '@frontend/services/app.service';
import { IUiFormField, UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.css']
})
export class RedirectComponent implements OnInit {
  rememberChoiceForm: UiForm;
  redirectData: IRedirectData;
  storedRedirectData: IRedirectData;
  doNotShowRedirect: boolean;

  constructor(private baseAppService: BaseAppService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    //Data sent to redirect component
    this.redirectData = history.state.data;
    //Previous stored choices
    this.storedRedirectData = JSON.parse(localStorage.getItem('redirect_data')) as IRedirectData;

    if (this.storedRedirectData) {
      switch (this.redirectData.social_type) {
        case ShareLocations.Facebook:
          this.doNotShowRedirect = this.storedRedirectData.stored_redirect_choice_facebook;
          break;
        case ShareLocations.Twitter:
          this.doNotShowRedirect = this.storedRedirectData.stored_redirect_choice_twitter;
          break;
        case ShareLocations.Linkedin:
          this.doNotShowRedirect = this.storedRedirectData.stored_redirect_choice_linkedin;
          break;
      }
    }

    this.doNotShowRedirect ? this.openExternal() : null;

    this.rememberChoiceForm = new UiForm({
      fields: {
        redirect: UiField.Checkbox({
          label: $localize`Don't show this next time for ${this.redirectData.social_type}.com`,
          initial: this.doNotShowRedirect
        })
      },
      resolvers: {
        output: async v => {
          switch (this.redirectData.social_type) {
            case ShareLocations.Facebook:
              this.redirectData.stored_redirect_choice_facebook = v.redirect;
              break;
            case ShareLocations.Twitter:
              this.redirectData.stored_redirect_choice_twitter = v.redirect;
              break;
            case ShareLocations.Linkedin:
              this.redirectData.stored_redirect_choice_linkedin = v.redirect;
              break;
          }
          // this.redirectData.show_redirect = v.redirect;
          localStorage.setItem(`redirect_data`, JSON.stringify(this.redirectData));
        }
      },
      handlers: {
        success: async () => {},
        changes: async () => {
          this.rememberChoiceForm.submit();
        }
      }
    });
  }

  openExternal() {
    window.open(this.redirectData.redirect_to);
    this.returnToCaller();
  }

  returnToCaller() {
    this.baseAppService.navigateTo(this.redirectData.redirect_from);
  }
}
