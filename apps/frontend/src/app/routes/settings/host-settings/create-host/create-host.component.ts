import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IHost, IHostStub, IUser } from '@core/interfaces';
import { ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { IUiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';

@Component({
  selector: 'app-create-host',
  templateUrl: './create-host.component.html',
  styleUrls: ['./create-host.component.scss']
})
export class CreateHostComponent implements OnInit {
  @Input() host:IHostStub;
  @Input() user:IUser;
  hostForm:IUiForm<IHost>;
  hostData:ICacheable<IHostStub>  = {
    data: null,
    loading: false,
    error: "",
    form_errors: {
      host_name: null,
      host_username: null,
      email_address: null
    }
  }

  @Output() hostRegistered:EventEmitter<IHost> = new EventEmitter();
  showForm:boolean = true;

  constructor(private hostService:HostService, private appService:BaseAppService) { }

  ngOnInit(): void {
    this.hostForm = {
      fields: {
        username: {
          type: "text",
          hint: "This will be the name of your host account on StageUp. Your URL will be: https://stageup.uk/@username",
          label: "Host Username",
          validators: [
            { type: "required" },
            { type: "minlength", value: 6 },
            { type: "maxlength", value: 32 },
            { type: "pattern", value: /^[a-zA-Z0-9]*$/, message: e => "Must be alphanumeric with no spaces" }
          ]
        },
        name: {
          type: "text",
          label: "Host Name",
          validators: [
            { type: "required" },
            { type: "minlength", value: 6 },
            { type: "maxlength", value: 32 }
          ]
        },
        email_address: {
          type: "text",
          label: "Contact e-mail",
          validators: [
            { type: "required" },
            { type: "email" },
            { type: "maxlength", value: 32 }
          ]
        },
      },
      submit: {
        variant: "primary",
        text: "Create Host",
        size: "l",
        handler: async d => this.hostService.createHost(d)
      }
    }
  }

  handleFormSuccess(host:IHost) {
    this.hostRegistered.emit(host);
  }

  handleFormFailure(e:HttpErrorResponse) {
    this.showForm = false;
  }
}
