import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IHostStub, IUser } from '@eventi/interfaces';
import { ICacheable } from 'src/app/app.interfaces';
import { HostService } from 'src/app/services/host.service';
import { displayValidationErrors, handleFormErrors } from 'src/app/_helpers/formErrorHandler';

@Component({
  selector: 'app-create-host',
  templateUrl: './create-host.component.html',
  styleUrls: ['./create-host.component.scss']
})
export class CreateHostComponent implements OnInit {
  @Input() host:IHostStub;
  @Input() user:IUser;

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

  hostForm:FormGroup;

  constructor(private fb:FormBuilder, private hostService:HostService) { }

  ngOnInit(): void {
    this.hostForm = this.fb.group({
      host_name: ["", [Validators.required, Validators.minLength(6)]],
      host_username: ["", [Validators.required, Validators.minLength(6)]],
      email_address: ["", [Validators.required, Validators.email]],
    });
  }

  submitHandler() {
    this.hostData.loading = true;
    this.hostService.createHost(this.hostForm.value)
      .then(h => {
        this.hostData.data = h;
      })
      .catch((e:HttpErrorResponse) => {
        this.hostData = handleFormErrors(this.hostData, e.error);
        displayValidationErrors(this.hostForm, this.hostData);
      })
      .finally(() => this.hostData.loading = false);
  }
}
