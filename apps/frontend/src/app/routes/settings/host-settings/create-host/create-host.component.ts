import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IHost, IHostStub, IUser } from '@core/interfaces';
import { BaseAppService } from 'apps/frontend/src/app/services/app.service';
import { HostService } from 'apps/frontend/src/app/services/host.service';
import { UiField, UiForm } from 'apps/frontend/src/app/ui-lib/form/form.interfaces';

@Component({
  selector: 'app-create-host',
  templateUrl: './create-host.component.html',
  styleUrls: ['./create-host.component.scss']
})
export class CreateHostComponent implements OnInit {
  @Input() host:IHostStub;
  @Input() user:IUser;
  @Output() hostRegistered:EventEmitter<IHost> = new EventEmitter();

  hostForm:UiForm<IHost>;

  constructor(private hostService:HostService) { }

  ngOnInit(): void {
    this.hostForm = new UiForm({
      fields: {
        username: UiField.Text({
          hint: "This will be the name of your host account on StageUp. Your URL will be: https://stageup.uk/@username",
          label: "Host Username",
          validators: [
            { type: "required" },
            { type: "minlength", value: 6 },
            { type: "maxlength", value: 32 },
            { type: "pattern", value: /^[a-zA-Z0-9]*$/, message: () => "Must be alphanumeric with no spaces" }
          ]
        }),
        name: UiField.Text({
          label: "Host Name",
          validators: [
            { type: "required" },
            { type: "minlength", value: 6 },
            { type: "maxlength", value: 32 }
          ]
        }),
        email_address: UiField.Text({
          label: "Contact e-mail",
          validators: [
            { type: "required" },
            { type: "email" },
            { type: "maxlength", value: 32 }
          ]
        }),
      },
      resolvers: {
        output: async d => this.hostService.createHost(d)
      },
      handlers: {
        success: async host => this.hostRegistered.emit(host),
      }
    })
  }
}
