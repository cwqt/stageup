import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { IGraphNode } from '@cxss/interfaces';
import { BehaviorSubject } from 'rxjs';

class IFlatGraphNode {
  _id: string;
  name: string;
  level: number;
  expandable: boolean;
  icon?:string;
}

@Component({
  selector: 'ui-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent implements OnInit {
  @ViewChild('selector') selector:MatSelect;

  @Input() label:string;
  @Input() required:boolean = false;
  @Input() showId:boolean = true;
  @Input() disabled:boolean = false;

  @Input() graph: IGraphNode[];
  @Input() selectMany = false;
  @Output() selectionChange: EventEmitter<IGraphNode[]> = new EventEmitter();

  noNestedNodes:boolean = false;

  flatNodeMap = new Map<IFlatGraphNode, IGraphNode>();
  nestedNodeMap = new Map<IGraphNode, IFlatGraphNode>();
  treeControl: FlatTreeControl<IFlatGraphNode>;
  treeFlattener: MatTreeFlattener<IGraphNode, IFlatGraphNode>;
  dataSource: MatTreeFlatDataSource<IGraphNode, IFlatGraphNode>;
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

  constructor() {
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
  }

  ngOnInit(): void {
    this.checklistSelection = new SelectionModel<IFlatGraphNode>(this.selectMany);
    this.dataSource.data = this.graph;
    this.noNestedNodes = this.graph.every(x => x.children == null || x.children?.length == 0);
  }

  getSelection(): IFlatGraphNode[] {
    return this.checklistSelection.selected;
  }
}
