import { createICacheable } from '../../app.interfaces';
import { UiForm, UiField } from './form.interfaces';

describe('UiForm Testing', () => {
  it('Should create a UiForm ', () => {
    const form = new UiForm({
      fields: {
        text_field: UiField.Text({
          label: "Text Field"
        }),
        number_field: UiField.Number({
          label: "Number Field"
        }),
        textarea_field: UiField.Textarea({
          rows: 5
        }),
        container_field: UiField.Container({
          fields: {
            checkbox_field: UiField.Checkbox({
              label: "Checkbox Field"
            }),
            select_field: UiField.Select({
              values: new Map([
                ['hello', { label: 'Hello' }],
                ['world', { label: 'World' }]
              ])
            }),
            nested_container_field: UiField.Container({
              fields: {
                time_field: UiField.Time({})
              }
            })
          }
        }),
        password_field: UiField.Password({}),
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
        output: { resolver: async () => {}, mapper: {} }
      }
    }, createICacheable());

    console.log(form.group)


  });
});