import { EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

interface IGenericDialog {
    submit: EventEmitter<any>;
    cancel: EventEmitter<any>;
    onSubmit:Function;
    onCancel:Function;
  }
  
  //Input, Output, Cancel
  export class Dialog<I,O,C=null> implements IGenericDialog, OnInit {
    @Output() submit: EventEmitter<O> = new EventEmitter();
    @Output() cancel: EventEmitter<C> = new EventEmitter();
  
    constructor(@Inject(MAT_DIALOG_DATA) public data: I) {}
    ngOnInit(): void {}
  
    onSubmit(output?:O) { this.submit.emit(output) }
    onCancel(output?:C) { this.cancel.emit(output) }
  }