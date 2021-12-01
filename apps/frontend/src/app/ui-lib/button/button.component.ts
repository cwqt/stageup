import { ThemeStyle, ThemeAppearance } from './../ui-lib.interfaces';
import { extractStyle } from './../../../../../../libs/shared/src/helpers/index';
import { animate, transition, trigger } from '@angular/animations';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { dimensionClassMap, ThemeDimension, ThemeKind } from '../ui-lib.interfaces';
interface Ripple {
  x: number;
  y: number;
  show: boolean;
}

@Component({
  selector: 'ui-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  animations: [
    trigger('toggle', [
      transition(':enter', animate('500ms ease-in-out')),
      transition(':leave', animate('500ms ease-in-out'))
    ])
  ]
})
export class ButtonComponent implements OnInit {
  @Output() click = new EventEmitter();
  @Input() tooltip?: string;
  @Input() disabled?: boolean = false;
  @Input() loading?: boolean = false;
  @Input() transparent?: boolean = false;
  @Input() icon?: string;
  @Input() type?: 'submit';
  @Input() buttonStyle?: ThemeStyle = 'accent-m-fill';

  @Input() centerRipple?: boolean;

  @Input() height?: string; // Can pass specific height value

  @ViewChild('button') button: ElementRef;
  dimensionClassMap = dimensionClassMap;
  ripples: Ripple[];

  size2?: ThemeDimension = ThemeDimension.Medium;
  kind2?: ThemeKind = ThemeKind.Accent;
  appearance2?: ThemeAppearance = ThemeAppearance.Fill;


  constructor() {}

  ngOnInit(): void {
    Object.assign(this, extractStyle(this.buttonStyle));
    this.ripples = [];
  }

  onClick(event) {
    // this.click.emit(event);
  }

  animateRipple(e: MouseEvent) {
    let el = this.button.nativeElement;
    let pos = el.getBoundingClientRect();

    this.ripples.push({
      x: this.centerRipple ? pos.width / 2 : e.clientX - pos.left,
      y: this.centerRipple ? pos.height / 2 : e.clientY - pos.top,
      show: true
    });
  }

  rippleEnd(rippleIdx: number) {
    // this.ripples[rippleIdx].show = false;
    setTimeout(() => {
      this.ripples.splice(rippleIdx, 1);
    }, 2000);
  }
}
