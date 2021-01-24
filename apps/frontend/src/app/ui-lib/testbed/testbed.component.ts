import { Component, OnInit } from "@angular/core";
import { resolve } from "dns";
import { createICacheable } from "src/app/app.interfaces";
import { IUiFieldSelectOptions, IUiForm } from "../form/form.interfaces";

@Component({
  selector: "ui-testbed",
  templateUrl: "./testbed.component.html",
  styleUrls: ["./testbed.component.scss"],
})
export class TestbedComponent implements OnInit {
  textString: string = "cass";
  numberString: number = 1;
  boolString: boolean = true;

  cacheable = createICacheable();

  form:IUiForm<any> = {
    fields: [
      {
        type: "text",
        field_name: "text_field",
        label: "Text Field",
      },
      {
        type: "text",
        field_name: "number_field",
        label: "Number Field",
      },
      {
        type: "textarea",
        field_name: "textarea_field",
        label: "Textarea Field",
      },
      {
        type: "container",
        field_name: "container_field",
        label: "Container",
        fields: [
          {
            type: "checkbox",
            field_name: "checkbox_field",
            label: "Checkbox Field",
          },    
          {
            type: "select",
            field_name: "select_field",
            label: "Select Field",
            options: <IUiFieldSelectOptions>{
              multi: true,
              values: [
                {
                  _id: 1,
                  name: "hello",
                  icon: "person",
                },
                {
                  _id: 2,
                  name: "world",
                  icon: "person",
                  children: [
                    {
                      _id: 3,
                      name: "world",
                      icon: "person",
                    }    
                  ]
                }
              ]
            }
          },
        ]
      },
      {
        type: "password",
        field_name: "password_field",
        label: "Password Field",
      },
    ],
    submit: {
      variant: "primary",
      text: "Send form!",
      handler: async data => this.handleForm(data)
    }
  }


  constructor() {}

  ngOnInit(): void {}

  handleForm(data:any) {
    console.log("UI Form Data: ", data);
    return new Promise((res, rej) => {
      setTimeout(res, 1000);
    })
  }
}
