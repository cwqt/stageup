import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IHost, IHostStub, IUser } from '@eventi/interfaces';
import { ICacheable } from 'src/app/app.interfaces';
import { HostService } from 'src/app/services/host.service';
import { IUiForm } from 'src/app/ui-lib/form/form.component';
import { displayValidationErrors, handleFormErrors } from 'src/app/_helpers/formErrorHandler';

@Component({
  selector: 'app-create-host',
  templateUrl: './create-host.component.html',
  styleUrls: ['./create-host.component.scss']
})
export class CreateHostComponent implements OnInit {
  @Input() host:IHostStub;
  @Input() user:IUser;
  hostForm:IUiForm<string>;
  hostData:ICacheable<IHostStub>  = {
    data: null,
    loading: false,
    error: "",
    form_errors: {
      host_name: "",
      host_username: "",
      email_address: ""
    }
  }

  constructor(private hostService:HostService) { }

  ngOnInit(): void {
    this.hostForm = {
      fields: [
        {
          type: "text",
          field_name: "host_name",
          label: "Host Username",
          hint: "This will be the name of your host account on Eventi. Your URL will be: https://eventi.com/username",
          validators: [
            { type: "required" },
            { type: "minlength", value: 6 },
            { type: "maxlength", value: 32 }
          ]
        },
        {
          type: "text",
          field_name: "host_username",
          label: "Host Name",
          validators: [
            { type: "required" },
            { type: "minlength", value: 6 },
            { type: "maxlength", value: 32 },
            { type: "pattern", value: /^[a-zA-Z0-9]*$/, message: e => "Must be alphanumeric with no spaces" }
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
        handler: this.submitHandler
      }
    }
  }

  handleFormSuccess(event) {
    console.log('form success!')
  }

  handleFormFailure(event) {
    console.log('form failed!')
  }

  submitHandler():Promise<string> {
    return new Promise((res, rej) => {
      setTimeout(() => {
        res('wow!')
      }, 500);
    })
  }

  // submitHandler() {
  //   this.hostData.loading = true;
  //   this.hostService.createHost(this.hostForm.value)
  //     .then(h => {
  //       this.hostData.data = h;
  //     })
  //     .catch((e:HttpErrorResponse) => {
  //       this.hostData = handleFormErrors(this.hostData, e.error);
  //       displayValidationErrors(this.hostForm, this.hostData);
  //     })
  //     .finally(() => this.hostData.loading = false);
  // }
}
