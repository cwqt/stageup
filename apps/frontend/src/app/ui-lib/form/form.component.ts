import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { UiForm } from './form.interfaces';

@Component({
  selector: 'ui-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit, AfterViewInit {
  @Input() form: UiForm<any>;

  constructor() {}
  ngOnInit() {}
  ngAfterViewInit() {}
}
