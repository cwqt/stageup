import { Component, OnInit } from '@angular/core';
import { enumToValues } from '@core/helpers';
import { capitalize, PersonTitle } from '@core/interfaces';
import { ToastService } from '@frontend/services/toast.service';
import { createICacheable } from 'apps/frontend/src/app/app.interfaces';
import { UiField, UiForm } from '../form/form.interfaces';
import { UiTable } from '../table/table.class';
import { ThemeKind } from '../ui-lib.interfaces';

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
  table: UiTable;

  toasts: { [index in ThemeKind]: `${Capitalize<index>} Toast` } = {
    [ThemeKind.Accent]: 'Accent Toast',
    [ThemeKind.Danger]: 'Danger Toast',
    [ThemeKind.Primary]: 'Primary Toast',
    [ThemeKind.Secondary]: 'Secondary Toast',
    [ThemeKind.Warning]: 'Warning Toast',
    [ThemeKind.Dark]: 'Dark Toast',
    [ThemeKind.PrimaryLight]: 'Primarylight Toast'
  };

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.form = new UiForm<{ hello: string; world: number }, any>(
      {
        fields: {
          text_field: UiField.Text({
            label: $localize`:@@testbed_text_field:Text Field`,
            width: 6,
            validators: [{ type: 'required' }, { type: 'maxlength', value: 512 }]
          }),
          number_field: UiField.Number({
            label: $localize`:@@testbed_number_field:Number Field`,
            width: 6
          }),
          textarea_field: UiField.Textarea({
            label: $localize`:@@testbed_textarea_field:Textarea Field`,
            rows: 3,
            validators: [{ type: 'minlength', value: 10 }]
          }),
          richtext_field: UiField.Richtext({
            label: $localize`:@@testbed_rich_field:RichText Field`,
            validators: [{ type: 'required' }, { type: 'maxlength', value: 512 }],
            hint: 'Markdown!'
          }),
          container_field: UiField.Container({
            label: $localize`:@@testbed_container_field:Container Field`,
            fields: {
              checkbox_field: UiField.Checkbox({
                label: $localize`:@@testbed_checkbox_field:Checkbox Field`
              }),
              select_field: UiField.Select({
                label: $localize`:@@testbed_select_field:Select Field`,
                hint: $localize`:@@testbed_select_field_hint:This is a piece of hinted text`,
                has_search: true,
                values: enumToValues(PersonTitle).reduce((acc, curr) => {
                  acc.set(curr, { label: capitalize(curr) });
                  return acc;
                }, new Map())
              }),
              nested_container_field: UiField.Container({
                fields: {
                  // money_field: UiField.Money({ currency: CurrencyCode.GBP }),
                  time_field: UiField.Time({ label: $localize`:@@testbed_time_field:Time Field` })
                }
              })
            }
          }),
          password_field: UiField.Password({
            placeholder: $localize`:@@testbed_password_field:Enter your password in this small field`
          }),
          radio_field: UiField.Radio({
            values: new Map([
              ['hello', { label: $localize`:@@testbed_radio_field_1:Hello` }],
              ['world', { label: $localize`:@@testbed_radio_field_2:World` }]
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

    this.table = new UiTable<{ name: string; age: number }>({
      title: $localize`:@@testbed_table_title:Table Example`,
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
            label: $localize`:@@testbed_table_action_log:Log selected values`,
            click: v => console.log(v)
          }
        ]
      },
      actions: [],
      pagination: { page_sizes: [5, 10, 25] },
      columns: [
        {
          label: $localize`:@@testbed_column_name:Name`,
          accessor: v => v.name
        },
        {
          label: $localize`:@@testbed_column_age:Age`,
          accessor: v => v.age
        }
      ]
    });
  }

  openToast(kind: ThemeKind) {
    this.toastService.emit(`This is a ${this.toasts[kind]}`, kind, { duration: 1000 });
  }

  handleForm(data: any) {
    console.log('UI Form Data: ', data);
    return new Promise((res, rej) => {
      setTimeout(res, 1000);
    });
  }
}
