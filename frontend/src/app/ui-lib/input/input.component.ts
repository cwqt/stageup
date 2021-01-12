import {
  Component,
  Input,
  Self,
  Optional,
} from "@angular/core";
import { ControlValueAccessor, NgControl } from "@angular/forms";
import { ErrCode } from "@eventi/interfaces";
import { IUiFormFieldValidator } from "../form/form.interfaces";
import { ThemeKind } from "../ui-lib.interfaces";


//https://material-ui.com/components/text-fields/
@Component({
  selector: "ui-input",
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.scss"],
})
export class InputComponent implements ControlValueAccessor {
  @Input() kind?: ThemeKind = ThemeKind.Accent;
  @Input() type: "number" | "text" | "password" | "textarea" | "checkbox";
  @Input() label?: string = "";
  @Input() placeholder?: string = "";
  @Input() hint?: string = "";
  @Input() disabled: boolean = false;
  @Input() icon?: string;

  @Input() required: boolean = true;
  @Input() maxlength?: number;
  @Input() minlength?: number;

  @Input() formControlName?: string;
  @Input() validatorFunctions: IUiFormFieldValidator[];

  _state: string = "hide";
  focused: boolean = false;
  passwordVisible: boolean = false;

  constructor(@Self() @Optional() public control: NgControl) {
    this.control && (this.control.valueAccessor = this);
  }

  ngOnInit(): void {
    this.placeholder = this.placeholder || "";
    setTimeout(() => console.log(this.value), 1000);
  }

  public get invalid(): boolean {
    return this.control ? this.control.invalid : false;
  }
  public get showError(): boolean {
    if (!this.control) return false;

    const { dirty, touched } = this.control;
    const doShow = this.focused
      ? false
      : this.invalid
      ? touched || dirty
      : false;
    this._state = doShow ? "show" : "hide";
    return doShow;
  }

  public get errors(): Array<string> {
    if (!this.control) return [];
    const { errors } = this.control;

    // Fallback messages if none provided
    const errorMap: { [index:string]: (e: any) => string } = {
      ["minlength"]: (e) =>
        `${this.label} must be at-least ${errors[e].requiredLength} characters`,
      ["maxlength"]: (e) =>
        `${this.label} must be less than ${errors[e].requiredLength} characters`,
      ["required"]: (e) => `${this.label} is required`,
      ["email"]: (e) => `Must be a valid e-mail address`,
      ["pattern"]: (e) => `Must fufill ReGex`,
      ["backendIssue"]: (e) => this.control.getError("backendIssue"),
    };

    // Actual error messages
    return Object.keys(errors || {}).map((e) => {
      const vf = this.validatorFunctions?.find((x) => x.type == e);
      return vf?.message
        ? vf.message(this.control) // client side message
        : errorMap[e] // 
        ? errorMap[e](e)
        : "Invalid field";
    });
  }

  // Form control configurations
  private _value: string | number;
  public get value(): string | number {
    return this._value;
  }
  public set value(v: string | number) {
    if (v !== this._value) {
      this._value = v;
      this.onChange(v);
    }
  }

  onFocus() {
    this.focused = true;
  }

  onChange = (_) => {};
  onTouched = () => {};
  writeValue(value: any): void {
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = () => {
      fn();
      this.focused = false;
    };
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  increment(event) {
    event.preventDefault();
    this.value = <number>this.value + 1;
  }

  decrement(event) {
    event.preventDefault();
    this.value = <number>this.value - 1;
  }

  togglePasswordVisibility(state: boolean, event) {
    this.passwordVisible = state;
    if(event) event.stopPropagation();
  }
}
