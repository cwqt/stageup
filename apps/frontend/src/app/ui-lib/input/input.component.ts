import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import {} from '@angular/material/autocomplete';
import { MatDateRangeInput } from '@angular/material/datepicker';
import { MatSelect } from '@angular/material/select';
import { Primitive } from '@core/interfaces';
import { ContentChange, QuillModules } from 'ngx-quill';
import { ReplaySubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { IUiFieldOptions, IUiFieldType, IUiFieldTypeOptions, IUiFormField } from '../form/form.interfaces';
import getSymbolFromCurrency from 'currency-map-symbol';

//https://material-ui.com/components/text-fields/
@Component({
  selector: 'ui-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent<T extends IUiFieldType> implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy {
  @Input() data?: IUiFormField<T>;

  @ViewChild('input') input: ElementRef;

  // Interface inputs
  focused: boolean;
  required: boolean;

  // Meta related stuff here
  meta: { [index in IUiFieldType]?: any } = {
    password: { is_visible: false },
    text: { max_length: null, min_length: null },
    textarea: { max_length: null, min_length: null },
    richtext: { max_length: null, min_length: null },
    money: { mask: { value: null, prefix: null } }
  };

  richTextModules: QuillModules;

  constructor(@Self() @Optional() public control: NgControl) {
    this.control && (this.control.valueAccessor = this);
  }

  ngOnInit(): void {
    // Set required label state for all required fields
    this.required = this.data.options.validators?.find(v => v.type == 'required') ? true : false;

    // Set min/max lengths for all text fields
    if (this.data.type == 'text' || this.data.type == 'textarea' || this.data.type == 'richtext') {
      this.meta[this.data.type].max_length =
        this.data.options.validators.find(v => v.type == 'maxlength')?.['value'] || null;

      this.meta[this.data.type].min_length =
        this.data.options.validators.find(v => v.type == 'minlength')?.['value'] || null;
    }

    if (this.data.type == 'money') {
      this.data.options['mask'] = {
        prefix: getSymbolFromCurrency(this.data.options['currency']),
        value: 'separator.2'
      };
    }

    if (this.data.type == 'richtext') this.initialiseRichText();
    if (this.data.type == 'select') this.initialiseSelection();
    if (this.data.type == 'time') {
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
    if (this.data.type == 'select') this.setInitialSelectValue();
    if (this.data.type == 'date' && this.data.options['is_date_range']) {
      // Can't bind ngModel to mat-date-picker-input :/
      this.pickerInput.rangePicker.stateChanges.subscribe(() => {
        this.value = this.pickerInput.value;
      });
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

  onFocusCallback = () => {
    this.focused = true;
  };
  onChangeCallback = _ => {};
  onTouchedCallback = () => {};

  writeValue(value: any): void {
    if (value !== this._value) {
      this._value = value;
    }

    this.onChangeCallback(this.value);
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

  setDisabledState?(isDisabled: boolean): void {}
  // -------------------------------------------------------------------------------------------------------

  public get invalid(): boolean {
    return this.control ? this.control.invalid : false;
  }

  public get showError(): boolean {
    if (!this.control) return false;

    // return !!(this.control && this.control.invalid && (this.control.dirty || this.control.touched));
    const { dirty, touched } = this.control;
    const doShow = this.focused ? false : this.invalid ? touched || dirty : false;
    return doShow;
  }

  public get errors(): Array<string> {
    if (!this.control) return [];
    const { errors } = this.control;

    // Fallback messages if none provided
    const errorMap: { [index: string]: (e: any) => string } = {
      ['minlength']: e => `${this.data.options.label} must be at-least ${errors[e].requiredLength} characters`,
      ['maxlength']: e => `${this.data.options.label} must be less than ${errors[e].requiredLength} characters`,
      ['required']: e => `${this.data.options.label} is required`,
      ['email']: e => `Must be a valid e-mail address`,
      ['pattern']: e => `Must fufill ReGex`,
      ['custom']: e => this.control.getError(e),
      ['backendIssue']: e => this.control.getError('backendIssue')
    };

    // Actual error messages
    return Object.keys(errors || {}).map(e => {
      const vf = this.data.options.validators?.find(x => x.type == e);
      return vf?.message
        ? vf.message(this.control) // client side message
        : errorMap[e] //
        ? errorMap[e](e)
        : 'Invalid field';
    });
  }

  select() {
    this.input.nativeElement.select();
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
    // this.passwordVisible = state;
    if (event) event.stopPropagation();
  }

  // Select ---------------------------------------------------------------------------------------------------
  @ViewChild('singleSelect', { static: false }) singleSelect: MatSelect;
  private selectOnDestroy = new Subject<void>();
  public filteredSelectionItems: ReplaySubject<IUiFieldTypeOptions['select']['values']> = new ReplaySubject<
    IUiFieldTypeOptions['select']['values']
  >(1);

  initialiseSelection() {
    // load the initial items list
    this.filteredSelectionItems.next(this.data.options['values'] as IUiFieldTypeOptions['select']['values']);
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
      if (this.data.options['initial']) {
        setTimeout(() => {
          this.singleSelect.writeValue(this.value);
        }, 0);
      }
    });
  }

  filterSelectionItems(event: string) {
    const options = (this.data.options as unknown) as IUiFieldTypeOptions['select'] & IUiFieldOptions;
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
    // this.selectionChange.emit(event);
  }

  originalOrder = (a, b): number => {
    return 0;
  };

  // Time ------------------------------------------------------------------------------------------------------
  // 24 hours / 15 minutes = 96 options, create an array of 15 minute increments
  timeItems: IUiFieldTypeOptions['select']['values'];

  // Date range input ------------------------------------------------------------------------------------------------------
  @ViewChild(MatDateRangeInput, { static: false }) pickerInput: MatDateRangeInput<Date>;

  // ngx-quill Rich Text --------------------------------------------------------------------------------
  initialiseRichText() {
    this.richTextModules = this.data.options['modules'] || {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'], // toggled buttons
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'] // remove formatting button
      ]
    };
  }

  richTextChanged(event: ContentChange) {
    console.log(event);
  }
}
