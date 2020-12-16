import { animate, state, style, transition, trigger } from "@angular/animations";
import { Component, Input, forwardRef, Self, Optional } from "@angular/core";
import { ControlValueAccessor, NgControl, FormGroup } from "@angular/forms";
import { IUiFormFieldValidator } from "../form/form.component";

@Component({
  selector: "ui-input",
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.scss"],
  animations: [
    trigger('animation', [
      state('show', style({
        opacity: 1,
        height: "auto"
      })),
      state('hide',   style({
        opacity: 0,
        transform: 'translateY(-1rem)',
        height: 0,
        overflow: "hidden"
      })),
      transition('show => hide', animate('200ms ease-out')),
      transition('* => show', animate('200ms ease-in'))
    ]),
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: "number" | "text" | "password" | "textarea" | "checkbox";
  @Input() formControlName?: string;
  @Input() label?: string;
  @Input() disabled: boolean = false;
  @Input() placeholder?:string;
  @Input() variant?: "primary" | "secondary";
  @Input() hint?:string;
  @Input() validatorFunctions: IUiFormFieldValidator[];

  _state:string = "hide";
  focused:boolean = false;

  constructor(@Self() @Optional() public control: NgControl) {
    this.control && (this.control.valueAccessor = this);
  }

  ngOnInit(): void {}

  public get invalid(): boolean { return this.control ? this.control.invalid : false }
  public get showError(): boolean {
    if (!this.control) return false;

    const { dirty, touched } = this.control;
    const doShow = this.focused ? false : this.invalid ? (touched || dirty) : false;
    this._state = doShow ? 'show' : 'hide';
    return doShow;
  }

  public get errors(): Array<string> {
    if (!this.control) return [];
    const { errors } = this.control;

    // Fallback messages if none provided
    const errorMap = {
      ["minlength"]: e => `${this.label} must be at-least ${errors[e].requiredLength} characters`,
      ["maxlength"]: e => `${this.label} must be less than ${errors[e].requiredLength} characters`,
      ["required"]: e => `${this.label} is required`,
      ["email"]: e => `Must be a valid e-mail address`,
      ["pattern"]: e => `Must fufill ReGex`,
    }
    
    return Object.keys(errors || {}).map(e => {
      const vf = this.validatorFunctions?.find(x => x.type == e);
      return vf?.message ? vf.message(this.control) : errorMap[e] ? errorMap[e](e) : 'Invalid field';
    })
  }

  // Form control configurations
  private _value: string | number;
  public get value(): string | number { return this._value; }
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
  writeValue(value: any): void { this.value = value }
  registerOnChange(fn: any): void { this.onChange = fn }
  registerOnTouched(fn: any): void { this.onTouched = () => { fn(); this.focused = false } }
  setDisabledState?(isDisabled: boolean): void { this.disabled = isDisabled }

  increment(event) {
    event.preventDefault();
    this.value = <number>this.value + 1;
  }
  decrement(event) {
    event.preventDefault();
    this.value = <number>this.value - 1;
  }
}
