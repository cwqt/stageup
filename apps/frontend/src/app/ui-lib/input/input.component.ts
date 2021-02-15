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
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { Primitive } from '@core/interfaces';
import { IUiFieldOptions, IUiFieldSelectOptions, IUiFormFieldValidator } from '../form/form.interfaces';
import { ThemeKind } from '../ui-lib.interfaces';
import { IUiFormField } from '../form/form.interfaces';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatSelect } from '@angular/material/select';
import { ReplaySubject, Subject } from 'rxjs';
import {} from '@angular/material/autocomplete';
import { take, takeUntil } from 'rxjs/operators';

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
  @Output() selectionChange: EventEmitter<IGraphNode[]> = new EventEmitter();
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
    if (this.type == 'select') this.initialiseSelection();
    if (this.type == 'tree') this.initialiseTree();
    if (this.type == 'time') {
      this.timeItems = new Array(96).fill(undefined).map((_, idx) => {
        // unix timestamp offset of 15 minutes == 900 seconds
        const offset = idx * 15 * 60;
        // key == human readable time
        let hours = Math.floor((offset % (3600 * 24)) / 3600);
        let minutes = Math.floor((offset % 3600) / 60);

        return {
          key: offset,
          value: `${hours}:${minutes.toLocaleString('en-GB', {
            minimumIntegerDigits: 2,
            useGrouping: false
          })}`
        };
      });
    }

    // Override initial value
    // this.value = undefined(!this.value && (this.options?.initial || this.initial)) ? (this.options?.initial ?? this.initial) : "";
    this.placeholder = this.placeholder ?? '';
  }

  ngAfterViewInit() {
    if (this.type == 'select') this.setInitialSelectValue();
  }

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

  // Form control configurations
  private _value: any = '';
  public get value(): any {
    return this._value;
  }
  public set value(v: any) {
    if (v !== this._value) {
      this._value = v;
      this.onChange(v);
    }
  }

  select() {
    this.input.nativeElement.select();
  }

  onFocus() {
    this.focused = true;
  }

  onChange = _ => {};
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
    if (event) event.stopPropagation();
  }

  // Select ---------------------------------------------------------------------------------------------------
  @ViewChild('singleSelect', { static: false }) singleSelect: MatSelect;
  public filteredSelectionItems: ReplaySubject<IGraphNode[]> = new ReplaySubject<IGraphNode[]>(1);
  _onDestroy = new Subject<void>();

  initialiseSelection() {
    // load the initial items list
    this.filteredSelectionItems.next(this.options.values.slice());
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  setInitialSelectValue() {
    this.filteredSelectionItems.pipe(take(1), takeUntil(this._onDestroy)).subscribe(() => {
      // setting the compareWith property to a comparison function
      // triggers initializing the selection according to the initial value of
      // the form control (i.e. _initializeSelection())
      // this needs to be done after the filteredSelectionItems are loaded initially
      // and after the mat-option elements are available
      this.singleSelect.compareWith = (a: IGraphNode, b: IGraphNode) => a && b && a === b;
    });
  }

  filterSelectionItems(event: string) {
    if (!this.options.values) return;
    if (!event) return this.filteredSelectionItems.next(this.options.values.slice());

    // Filter items by value
    this.filteredSelectionItems.next(
      this.options.values.filter(node => node.value.toLowerCase().indexOf(event.toLowerCase()) > -1)
    );
  }

  // Time ------------------------------------------------------------------------------------------------------
  // 24 hours / 15 minutes = 96 options, create an array of 15 minute increments
  timeItems: IUiFieldSelectOptions['values'];

  // Tree (w/ support for nested items) ------------------------------------------------------------------------
  @ViewChild('selector') selector?: MatSelect;
  noNestedNodes: boolean = false;
  flatNodeMap = new Map<IFlatGraphNode, IGraphNode>();
  nestedNodeMap = new Map<IGraphNode, IFlatGraphNode>();
  treeControl: FlatTreeControl<IFlatGraphNode>;
  treeFlattener: MatTreeFlattener<IGraphNode, IFlatGraphNode>;
  dataSource: MatTreeFlatDataSource<IFlatGraphNode, IFlatGraphNode>;
  checklistSelection: SelectionModel<IFlatGraphNode>;

  initialiseTree() {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<IFlatGraphNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this.checklistSelection = new SelectionModel<IFlatGraphNode>(this.options.multi);

    this.dataSource.data = (<IUiFieldSelectOptions>this.options).values;
    this.noNestedNodes = this.options.values.every(x => x.children == null || x.children?.length == 0);
  }

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: IFlatGraphNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    if (descendants.length === 0) return this.checklistSelection.isSelected(node);

    return descendants.every(child => this.checklistSelection.isSelected(child));
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: IFlatGraphNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  untoggleAll(node) {
    let parents = [];
    let parent = this.getParentNode(node);
    if (parent) parents.push(parent.key);
    while (parent) {
      parent = this.getParentNode(parent);
      if (parent) parents.push(parent.key);
    }

    this.treeControl.dataNodes.forEach(n => {
      if (!parents.includes(n.key) && n.key !== node.key) {
        this.treeControl.collapse(n);
      }
    });
  }

  /** Toggle the item selection. Select/deselect all the descendants node */
  rootNodeSelectionToggle(node: IFlatGraphNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);

    // for multi select only
    if (this.checklistSelection.isMultipleSelection()) {
      this.checklistSelection.isSelected(node)
        ? this.checklistSelection.select(...descendants)
        : this.checklistSelection.deselect(...descendants);
    }

    // Force update for the parent
    descendants.every(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
    this.selectionChange.emit(this.checklistSelection.selected.map(n => this.flatNodeMap.get(n)));
  }

  /** Toggle a leaf node selection. Check all the parents to see if they changed */
  leafNodeItemSelectionToggle(node: IFlatGraphNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
    // this.selectionChange.emit(this.checklistSelection.selected.map(x => this.dataSource.));
    if (this.noNestedNodes) this.selector.close();
    this.selectionChange.emit(this.checklistSelection.selected.map(n => this.flatNodeMap.get(n)));
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: IFlatGraphNode): void {
    let parent: IFlatGraphNode | null = this.getParentNode(node);
    while (parent) {
      // recurse to top of tree
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: IFlatGraphNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child => this.checklistSelection.isSelected(child));

    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      if (this.checklistSelection.isMultipleSelection() && descendants.length != 1) {
        this.checklistSelection.select(node);
      }
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: IFlatGraphNode): IFlatGraphNode | null {
    const currentLevel = this.getLevel(node);
    if (currentLevel < 1) return null;

    for (let i = this.treeControl.dataNodes.indexOf(node) - 1; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];
      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }

    return null;
  }

  getLevel = (node: IFlatGraphNode) => node.level;
  isExpandable = (node: IFlatGraphNode) => node.expandable;
  getChildren = (node: IGraphNode): IGraphNode[] => node.children;
  hasChild = (_: number, _nodeData: IFlatGraphNode) => _nodeData.expandable;

  transformer = (node: IGraphNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.key === node.key ? existingNode : ({} as IFlatGraphNode);
    flatNode.key = node.key;
    flatNode.value = node.value;

    flatNode.level = level;
    flatNode.expandable = !!node.children?.length;
    flatNode.icon = (<any>node).icon;

    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  getSelection(): IFlatGraphNode[] {
    return this.checklistSelection.selected;
  }
}
