import {
  Component,
  Input,
  Self,
  Optional,
  ViewChild,
  Output,
  EventEmitter,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef
} from '@angular/core';
import { ControlValueAccessor, NgControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Primitive } from '@core/interfaces';
import { IUiFieldOptions, IUiFieldSelectOptions, IUiFormFieldValidator } from '../form/form.interfaces';
import { ThemeKind } from '../ui-lib.interfaces';
import { IUiFormField } from '../form/form.interfaces';
import { MatSelect } from '@angular/material/select';
import { ReplaySubject, Subject } from 'rxjs';
import {} from '@angular/material/autocomplete';
import { take, takeUntil } from 'rxjs/operators';
import { KeyValue } from 'aws-sdk/clients/iot';
import { MatDateRangeInput, MatDateRangePicker } from '@angular/material/datepicker';

export class IFlatGraphNode {
  key: number | string;
  value: Primitive;
  icon?: string;

  level?: number;
  expandable?: boolean;
}

export interface IGraphNode {
  key: number | string;
  value: Primitive;
  icon?: string;
  children?: IGraphNode[];

  level: number;
  expandable: boolean;
}

//https://material-ui.com/components/text-fields/
@Component({
  selector: 'ui-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy {
  @Output() change:EventEmitter<any> = new EventEmitter();
  @Output() selectionChange: EventEmitter<Primitive> = new EventEmitter();

  @ViewChild('input') input: ElementRef;

  // Interface inputs
  @Input() kind?: ThemeKind = ThemeKind.Accent;
  @Input() type: IUiFormField['type'];
  @Input() label?: string = '';
  @Input() placeholder?: string = '';
  @Input() initial?: Primitive = '';
  @Input() hint?: string = '';
  @Input() disabled: boolean = false;
  @Input() icon?: string;
  @Input() id?: string;

  @Input() options?: IUiFormField['options'];

  @Input() required: boolean = false;
  @Input() maxlength?: number = null;
  @Input() minlength?: number = null;

  @Input() formControlName?: string;
  @Input() validatorFunctions: IUiFormFieldValidator[];

  _state: string = 'hide';
  focused: boolean = false;
  passwordVisible: boolean = false;

  constructor(@Self() @Optional() public control: NgControl) {
    this.control && (this.control.valueAccessor = this);
  }

  ngOnInit(): void {
    // Override initial value
    if (this.initial ?? this.options?.initial) this.value = this.initial ?? this.options?.initial;
    this.placeholder = this.placeholder ?? '';

    if (this.type == 'select') this.initialiseSelection();
    if (this.type == 'time') {
      this.timeItems = new Map(
        new Array(96).fill(undefined).map((_, idx) => {
          // unix timestamp offset of 15 minutes == 900 seconds
          const offset = idx * 15 * 60;
          // key == human readable time
          let hours = Math.floor((offset % (3600 * 24)) / 3600);
          let minutes = Math.floor((offset % 3600) / 60);

          return [
            offset,
            {
              label: `${hours}:${minutes.toLocaleString('en-GB', {
                minimumIntegerDigits: 2,
                useGrouping: false
              })}`
            }
          ];
        })
      );
    }
  }

  ngAfterViewInit() {
    if (this.type == 'select') this.setInitialSelectValue();
		if (this.type == "date" && this.options?.is_date_range) {
			// Can't bind ngModel to mat-date-picker-input :/
			this.pickerInput.rangePicker.stateChanges.subscribe(() => {
				this.value = this.pickerInput.value;
			})
		}
  }

  // ControlValueAccessor --------------------------------------------------------------------------------
  private _value: any = '';
  public get value(): any {
    return this._value;
  }

  public set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this.onChangeCallback(v);
    }
  }

  onFocusCallback = () => { this.focused = true }
  onChangeCallback = _ => {};
  onTouchedCallback = () => {};

  writeValue(value: any): void {
    if (value !== this._value) {
      this._value = value;
    }

    this.onChangeCallback(this.value);
    this.change.emit(this.value);
  }

  registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouchedCallback = () => {
      fn();
      this.focused = false;
    };
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  // -------------------------------------------------------------------------------------------------------

  public get invalid(): boolean {
    return this.control ? this.control.invalid : false;
  }
  public get showError(): boolean {
    if (!this.control) return false;

    const { dirty, touched } = this.control;
    const doShow = this.focused ? false : this.invalid ? touched || dirty : false;
    this._state = doShow ? 'show' : 'hide';
    return doShow;
  }

  public get errors(): Array<string> {
    if (!this.control) return [];
    const { errors } = this.control;

    // Fallback messages if none provided
    const errorMap: { [index: string]: (e: any) => string } = {
      ['minlength']: e => `${this.label} must be at-least ${errors[e].requiredLength} characters`,
      ['maxlength']: e => `${this.label} must be less than ${errors[e].requiredLength} characters`,
      ['required']: e => `${this.label} is required`,
      ['email']: e => `Must be a valid e-mail address`,
      ['pattern']: e => `Must fufill ReGex`,
      ['custom']: e => this.control.getError(e),
      ['backendIssue']: e => this.control.getError('backendIssue')
    };

    // Actual error messages
    return Object.keys(errors || {}).map(e => {
      const vf = this.validatorFunctions?.find(x => x.type == e);
      return vf?.message
        ? vf.message(this.control) // client side message
        : errorMap[e] //
        ? errorMap[e](e)
        : 'Invalid field';
    });
  }

  select() { this.input.nativeElement.select(); }

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
    if (event) event.stopPropagation();
  }

  // Select ---------------------------------------------------------------------------------------------------
  @ViewChild('singleSelect', { static: false }) singleSelect: MatSelect;
  private selectOnDestroy = new Subject<void>();
  public filteredSelectionItems: ReplaySubject<IUiFieldSelectOptions['values']> = new ReplaySubject<
    IUiFieldSelectOptions['values']
  >(1);

  initialiseSelection() {
    // load the initial items list
    this.filteredSelectionItems.next(this.options.values as IUiFieldSelectOptions['values']);
  }

  ngOnDestroy() {
    this.selectOnDestroy.next();
    this.selectOnDestroy.complete();
  }

  setInitialSelectValue() {
    this.filteredSelectionItems.pipe(take(1), takeUntil(this.selectOnDestroy)).subscribe(() => {
      // setting the compareWith property to a comparison function
      // triggers initializing the selection according to the initial value of
      // the form control (i.e. _initializeSelection())
      // this needs to be done after the filteredSelectionItems are loaded initially
      // and after the mat-option elements are available
      // https://stackoverflow.com/a/54020212
      this.singleSelect.compareWith = (a, b) => a && b && a === b;

      // Set value equal to compareWith value for initial value to be selected
      if (this.initial) {
        setTimeout(() => {
          this.singleSelect.writeValue(this.value);
        }, 0);
      }
    });
  }

  filterSelectionItems(event: string) {
    const options = this.options as IUiFieldSelectOptions;
    if (!options.values) return;
    if (!event) return this.filteredSelectionItems.next(options.values);

    // Filter map items by labels & construct new filtered map
    this.filteredSelectionItems.next(
      Array.from(options.values.keys())
        .filter(node => options.values.get(node).label.toLowerCase().includes(event.toLowerCase()))
        .reduce((acc, curr) => acc.set(curr, options.values.get(curr)), new Map())
    );
  }

  emitSelectionChange(event: Primitive) {
    this.selectionChange.emit(event);
  }

  originalOrder = (a, b): number => {
    return 0;
  }

  // Time ------------------------------------------------------------------------------------------------------
  // 24 hours / 15 minutes = 96 options, create an array of 15 minute increments
  timeItems: IUiFieldSelectOptions['values'];

  // Date range input ------------------------------------------------------------------------------------------------------
	@ViewChild(MatDateRangeInput, { static: false }) pickerInput:MatDateRangeInput<Date>
}
