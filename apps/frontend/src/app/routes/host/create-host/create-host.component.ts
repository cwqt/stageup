import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IHost, IHostStub, IUser } from '@core/interfaces';
import { AppService } from '@frontend/services/app.service';
import { HostService } from '@frontend/services/host.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';

@Component({
  selector: 'app-create-host',
  templateUrl: './create-host.component.html',
  styleUrls: ['./create-host.component.scss']
})
export class CreateHostComponent implements OnInit {
  @Input() host: IHostStub;
  @Input() user: IUser;
  @Output() hostRegistered: EventEmitter<IHost> = new EventEmitter();

  hostForm: UiForm<IHost>;

  constructor(private hostService: HostService) {}

  ngOnInit(): void {
    this.hostForm = new UiForm({
      fields: {
        username: UiField.Text({
          hint: $localize`This will be the name of your host account on StageUp. Your URL will be: https://stageup.uk/@username`,
          label: $localize`Host Username`,
          validators: [
            { type: 'required' },
            { type: 'minlength', value: 6 },
            { type: 'maxlength', value: 64 },
            { type: 'pattern', value: /^[a-zA-Z0-9]*$/, message: () => $localize`Must be alphanumeric with no spaces` }
          ]
        }),
        name: UiField.Text({
          label: $localize`Company Name`,
          validators: [{ type: 'required' }, { type: 'minlength', value: 6 }, { type: 'maxlength', value: 64 }]
        }),
        email_address: UiField.Text({
          label: $localize`Contact e-mail address`,
          validators: [{ type: 'required' }, { type: 'email' }, { type: 'maxlength', value: 256 }]
        })
      },
      resolvers: {
        output: async d => this.hostService.createHost(d)
      },
      handlers: {
        success: async host => this.hostRegistered.emit(host)
      }
    });
  }
}
