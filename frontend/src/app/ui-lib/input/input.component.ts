import {
  Component,
  Input,
  Self,
  Optional,
  ViewChild,
  Output,
  EventEmitter,
} from "@angular/core";
import { ControlValueAccessor, NgControl } from "@angular/forms";
import { ErrCode } from "@eventi/interfaces";
import { IUiFormFieldValidator } from "../form/form.interfaces";
import { ThemeKind } from "../ui-lib.interfaces";
import { IUiFormField } from '../form/form.interfaces';
import { SelectionModel } from "@angular/cdk/collections";
import { MatTreeFlatDataSource, MatTreeFlattener } from "@angular/material/tree";
import { FlatTreeControl } from "@angular/cdk/tree";
import { MatSelect } from "@angular/material/select";

export class IFlatGraphNode {
  _id: number;
  name: string;
  level: number;
  expandable: boolean;
  icon: string;
}

export interface IGraphNode {
  name: string;
  _id: number;
  children?: IGraphNode[];

  level:number;
  expandable:boolean;
  icon:string;
}


//https://material-ui.com/components/text-fields/
@Component({
  selector: "ui-input",
  templateUrl: "./input.component.html",
  styleUrls: ["./input.component.scss"],
})
export class InputComponent implements ControlValueAccessor {
  @ViewChild('selector') selector:MatSelect;



  @Input() kind?: ThemeKind = ThemeKind.Accent;
  @Input() type: IUiFormField["type"];
  @Input() label?: string = "";
  @Input() placeholder?: string = "";
  @Input() hint?: string = "";
  @Input() disabled: boolean = false;
  @Input() icon?: string;

  @Output() selectionChange: EventEmitter<IGraphNode[]> = new EventEmitter();



  @Input() options?: IUiFormField["options"];

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
    if(this.type == "select") {

      this.treeFlattener = new MatTreeFlattener(
        this.transformer,
        this.getLevel,
        this.isExpandable,
        this.getChildren
      );
      this.treeControl = new FlatTreeControl<IFlatGraphNode>(
        this.getLevel,
        this.isExpandable
      );
      this.dataSource = new MatTreeFlatDataSource(
        this.treeControl,
        this.treeFlattener
      );

      this.checklistSelection = new SelectionModel<IFlatGraphNode>(this.options.multi);
      this.dataSource.data = this.options.values;
      this.noNestedNodes = this.options.values.every(x => x.children == null || x.children?.length == 0);  
    }

    this.placeholder = this.placeholder || "";
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



















  noNestedNodes:boolean = false;

  flatNodeMap = new Map<IFlatGraphNode, IGraphNode>();
  nestedNodeMap = new Map<IGraphNode, IFlatGraphNode>();
  treeControl: FlatTreeControl<IFlatGraphNode>;
  treeFlattener: MatTreeFlattener<IGraphNode, IFlatGraphNode>;
  dataSource: MatTreeFlatDataSource<IFlatGraphNode, IFlatGraphNode>;
  checklistSelection: SelectionModel<IFlatGraphNode>;

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: IFlatGraphNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    if(descendants.length === 0)
      return this.checklistSelection.isSelected(node)

    return descendants.every(child => this.checklistSelection.isSelected(child));
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: IFlatGraphNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some((child) =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  untoggleAll(node) {
    let parents = [];
    let parent = this.getParentNode(node);  
    if(parent) parents.push(parent._id)
    while(parent) {
      parent = this.getParentNode(parent);
      if(parent) parents.push(parent._id)
    }

    this.treeControl.dataNodes.forEach((n) => {
      if (!parents.includes(n._id) && n._id !== node._id) {
        this.treeControl.collapse(n);
      }
    });
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
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
    descendants.every((child) => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
    this.selectionChange.emit(this.checklistSelection.selected.map(n => this.flatNodeMap.get(n)));
  }

  /** Toggle a leaf node selection. Check all the parents to see if they changed */
  leafNodeItemSelectionToggle(node: IFlatGraphNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
    // this.selectionChange.emit(this.checklistSelection.selected.map(x => this.dataSource.));
    if(this.noNestedNodes) this.selector.close();
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
    const descAllSelected = descendants.every((child) =>
      this.checklistSelection.isSelected(child)
    );

    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      if(this.checklistSelection.isMultipleSelection() && descendants.length != 1) {      
        this.checklistSelection.select(node);
      }
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: IFlatGraphNode): IFlatGraphNode | null {
    const currentLevel = this.getLevel(node);
    if (currentLevel < 1) return null;

    for (let i = (this.treeControl.dataNodes.indexOf(node) - 1); i >= 0; i--) {
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
    const flatNode =
      existingNode && existingNode._id === node._id
        ? existingNode
        : ({} as IFlatGraphNode);
    flatNode._id = node._id;
    flatNode.name = node.name;
    flatNode.level = level;
    flatNode.expandable = !!node.children?.length;
    flatNode.icon = (<any>node).icon;

    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  getSelection(): IFlatGraphNode[] {
    return this.checklistSelection.selected;
  }

}
