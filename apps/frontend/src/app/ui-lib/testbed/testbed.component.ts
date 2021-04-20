import { Component, OnInit } from '@angular/core';
import { resolve } from 'dns';
import { createICacheable } from 'apps/frontend/src/app/app.interfaces';
import { UiField, IUiForm, UiForm } from '../form/form.interfaces';
import { PerformanceService } from '../../services/performance.service';
import { CurrencyCode } from '@core/interfaces';

@Component({
  selector: 'ui-testbed',
  templateUrl: './testbed.component.html',
  styleUrls: ['./testbed.component.scss']
})
export class TestbedComponent implements OnInit {
  textString: string = 'cass';
  numberString: number = 1;
  boolString: boolean = true;

  cacheable = createICacheable();

  form: UiForm;
  // form: IUiForm<any> = {
  //   fields: {
  //     text_field: {
  //       type: 'text',
  //       label: 'Text Field'
  //     },
  //     number_field: {
  //       type: 'text',
  //       label: 'Number Field'
  //     },
  //     textarea_field: {
  //       type: 'textarea',
  //       label: 'Textarea Field'
  //     },
  //     container_field: {
  //       type: 'container',
  //       label: 'Container',
  //       fields: {
  //         checkbox_field: {
  //           type: 'checkbox',
  //           label: 'Checkbox Field'
  //         },
  //         select_field: {
  //           type: 'select',
  //           label: 'Select Field',
  //           options: {
  //             multi: true,
  //             values: new Map([
  //               [1, { label: 'Hello' }],
  //               [2, { label: 'world', disabled: true }]
  //             ])
  //           }
  //         }
  //       }
  //     },
  //     password_field: {
  //       type: 'password',
  //       label: 'Password Field'
  //     }
  //   },
  //   submit: {
  //     variant: 'primary',
  //     text: 'Send form!',
  //   }
  // };

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    console.log(UiField)

    this.form = new UiForm<{ hello: string, world: number }, any>({
      fields: {
        text_field: UiField.Text({
          label: "Text Field",
          width: 6,
          validators: [
            { type: "maxlength", value: 512 }
          ]
        }),
        number_field: UiField.Number({
          label: "Number Field",
          width: 6,
        }),
        textarea_field: UiField.Textarea({
          label: "Textarea Field",
          rows: 5
        }),
        container_field: UiField.Container({
          label: "Container Field",
          fields: {
            checkbox_field: UiField.Checkbox({
              label: "Checkbox Field"
            }),
            select_field: UiField.Select({
              label: "Select Field",
              hint: "This is a piece of hinted text",
              values: new Map([
                ['hello', { label: 'Hello' }],
                ['world', { label: 'World' }]
              ])
            }),
            nested_container_field: UiField.Container({
              fields: {
                // money_field: UiField.Money({ currency: CurrencyCode.GBP }),
                time_field: UiField.Time({ label: "Time Field" })
              }
            })
          }
        }),
        password_field: UiField.Password({
          placeholder: "Enter your password in this small field"
        }),
        radio_field: UiField.Radio({
          values: new Map([
            ['hello', { label: 'Hello' }],
            ['world', { label: 'World' }]
          ])
        }),
        date_field: UiField.Date({
          is_date_range: false,
        }),
        date_range_field: UiField.Date({
          is_date_range: true,
        })
      },
      resolvers: {
        output: async f => ({
          hello: f.get("text_field").value,
          world: f.get("container_field.nested_container_field.time_field").value
        })
      }
    }, this.cacheable);
  }

  handleForm(data: any) {
    console.log('UI Form Data: ', data);
    return new Promise((res, rej) => {
      setTimeout(res, 1000);
    });
  }
}
