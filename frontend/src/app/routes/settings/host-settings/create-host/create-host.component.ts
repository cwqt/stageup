import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { IHost, IHostStub, IUser } from '@eventi/interfaces';
import { ICacheable } from 'src/app/app.interfaces';
import { BaseAppService } from 'src/app/services/app.service';
import { HostService } from 'src/app/services/host.service';
import { IUiForm } from 'src/app/ui-lib/form/form.interfaces';

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

  showForm:boolean = true;

  constructor(private hostService:HostService, private appService:BaseAppService) { }

  ngOnInit(): void {
    this.hostForm = {
      fields: [
        {
          type: "text",
          field_name: "username",
          hint: "This will be the name of your host account on Eventi. Your URL will be: https://eventi.com/username",
          label: "Host Username",
          validators: [
            { type: "required" },
            { type: "minlength", value: 6 },
            { type: "maxlength", value: 32 },
            { type: "pattern", value: /^[a-zA-Z0-9]*$/, message: e => "Must be alphanumeric with no spaces" }
          ]
        },
        {
          type: "text",
          field_name: "name",
          label: "Host Name",
          validators: [
            { type: "required" },
            { type: "minlength", value: 6 },
            { type: "maxlength", value: 32 }
          ]
        },
        {
          type: "text",
          field_name: "email_address",
          label: "Contact e-mail",
          validators: [
            { type: "required" },
            { type: "email" },
            { type: "maxlength", value: 32 }
          ]
        },

      ],
      submit: {
        variant: "primary",
        text: "Create Host",
        size: "l",
        fullWidth: true,
        handler: async d => this.hostService.createHost(d)
      }
    }
  }

  handleFormSuccess(host:IHost) {
    this.appService.navigateTo('/host');
  }

  handleFormFailure(e:HttpErrorResponse) {
    this.showForm = false;
  }
}
