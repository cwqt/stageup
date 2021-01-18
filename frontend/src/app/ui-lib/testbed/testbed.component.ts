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
    fields: {
      text_field: {
        type: "text",
        label: "Text Field",
      },
      number_field: {
        type: "text",
        label: "Number Field",
      },
      textarea_field: {
        type: "textarea",
        label: "Textarea Field",
      },
      container_field: {
        type: "container",
        label: "Container",
        fields: {
          checkbox_field: {
            type: "checkbox",
            label: "Checkbox Field",
          },    
          select_field: {
            type: "select",
            label: "Select Field",
            options: <IUiFieldSelectOptions>{
              multi: true,
              values: [
                {
                  key: 1,
                  value: "hello",
                  icon: "person",
                },
                {
                  key: "wow",
                  value: "world",
                  children: [
                    {
                      key: 3,
                      value: "world",
                      icon: "person",
                    }    
                  ]
                }
              ]
            }
          },
        }
      },
      password_field: {
        type: "password",
        label: "Password Field",
      },
    },
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
