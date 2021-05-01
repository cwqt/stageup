import { Component, OnInit } from '@angular/core';
import { resolve } from 'dns';
import { createICacheable } from 'apps/frontend/src/app/app.interfaces';
import { UiField, IUiForm, UiForm } from '../form/form.interfaces';
import { PerformanceService } from '../../services/performance.service';
import { capitalize, CurrencyCode, PersonTitle } from '@core/interfaces';
import { enumToValues } from '@core/helpers';
import { IUiTable } from '../table/table.interfaces';

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
  table: IUiTable;

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    this.form = new UiForm<{ hello: string; world: number }, any>(
      {
        fields: {
          text_field: UiField.Text({
            label: 'Text Field',
            width: 6,
            validators: [{ type: 'maxlength', value: 512 }]
          }),
          number_field: UiField.Number({
            label: 'Number Field',
            width: 6
          }),
          textarea_field: UiField.Textarea({
            label: 'Textarea Field',
            rows: 5
          }),
          container_field: UiField.Container({
            label: 'Container Field',
            fields: {
              checkbox_field: UiField.Checkbox({
                label: 'Checkbox Field'
              }),
              select_field: UiField.Select({
                label: 'Select Field',
                hint: 'This is a piece of hinted text',
                has_search: true,
                values: enumToValues(PersonTitle).reduce((acc, curr) => {
                  acc.set(curr, { label: capitalize(curr) });
                  return acc;
                }, new Map())
              }),
              nested_container_field: UiField.Container({
                fields: {
                  // money_field: UiField.Money({ currency: CurrencyCode.GBP }),
                  time_field: UiField.Time({ label: 'Time Field' })
                }
              })
            }
          }),
          password_field: UiField.Password({
            placeholder: 'Enter your password in this small field'
          }),
          radio_field: UiField.Radio({
            values: new Map([
              ['hello', { label: 'Hello' }],
              ['world', { label: 'World' }]
            ])
          }),
          date_field: UiField.Date({
            is_date_range: false
          }),
          date_range_field: UiField.Date({
            is_date_range: true
          })
        },
        resolvers: {
          output: async f => ({
            hello: f.get('text_field').value,
            world: f.get('container_field.nested_container_field.time_field').value
          })
        },
        handlers: {
          changes: async v => console.log(v)
        }
      },
      this.cacheable
    );

    this.table = {
      title: 'Table Example',
      resolver: query =>
        Promise.resolve({
          data: [
            { name: 'Cass', age: 21 },
            { name: 'Drake', age: 311 },
            { name: 'Shreya', age: 32 },
            { name: 'Ben', age: 123 }
          ]
        }),
      selection: {
        multi: true,
        actions: [
          {
            label: 'Log selected values',
            click: v => console.log(v)
          }
        ]
      },
      actions: [],
      pagination: { page_sizes: [5, 10, 25] },
      columns: {
        name: {
          label: 'Name'
        },
        age: {
          label: 'Age'
        }
      }
    };
  }

  handleForm(data: any) {
    console.log('UI Form Data: ', data);
    return new Promise((res, rej) => {
      setTimeout(res, 1000);
    });
  }
}
