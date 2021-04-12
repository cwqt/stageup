import { animate, state, style, transition, trigger } from '@angular/animations';
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
  @Input() kind?: ThemeKind = ThemeKind.Accent;
  @Input() size?: ThemeDimension = ThemeDimension.Medium;
  @Input() tooltip?: string;
  @Input() disabled?: boolean = false;
  @Input() loading?: boolean = false;
  @Input() transparent?: boolean = false;
  @Input() icon?: string;
  @Input() type?: 'submit';

  @Input() centerRipple?: boolean;

  @ViewChild('button') button: ElementRef;
  dimensionClassMap = dimensionClassMap;
  ripples: Ripple[];

  constructor() {}

  ngOnInit(): void {
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
