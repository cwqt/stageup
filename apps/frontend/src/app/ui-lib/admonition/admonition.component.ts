import { Component, OnInit, Input } from '@angular/core';

const typeIconMap = {
  ['warning']: 'warning--alt--filled',
  ['info']: 'information',
  ['success']: 'checkbox--checked--filled',
  ['bug']: 'debug',
  ['example']: 'code',
  ['failure']: 'misuse'
};

@Component({
  selector: 'ui-admonition',
  templateUrl: './admonition.component.html',
  styleUrls: ['./admonition.component.scss']
})
export class AdmonitionComponent implements OnInit {
  @Input() icon?: string;
  @Input() kind: 'warning' | 'info' | 'success' | 'bug' | 'example' | 'failure' | 'info';
  @Input() title: string;

  constructor() {}

  ngOnInit(): void {
    this.icon = this.icon || typeIconMap[this.kind];
  }
}
