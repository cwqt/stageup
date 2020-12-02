import {Directive, Input, ElementRef, HostBinding, HostListener} from '@angular/core';
import {OverlayProperties} from '@ivylab/overlay-angular';
import {PopoverProperties} from './interfaces';
import {defaultProperties} from './default-properties';
import {Popover} from './popover.service';

@Directive({
    selector: '[popoverTriggerFor]'
})

export class PopoverTriggerDirective {
    @Input() popoverTriggerFor;
    @Input() popoverWidth: PopoverProperties['width'];
    @Input() popoverHeight: PopoverProperties['height'];
    @Input() placement: PopoverProperties['placement'];
    @Input() popoverClass: PopoverProperties['popoverClass'];
    @Input() theme: PopoverProperties['theme'];
    @Input() offset: PopoverProperties['offset'];
    @Input() animationDuration: PopoverProperties['animationDuration'];
    @Input() animationTimingFunction: PopoverProperties['animationTimingFunction'];
    @Input() animationTranslateY: PopoverProperties['animationTranslateY'];
    @Input() padding: PopoverProperties['padding'];
    @Input() zIndex: PopoverProperties['zIndex'];
    @Input() noArrow: PopoverProperties['noArrow'];

    @HostListener('click', ['$event'])
    onClick(event) {
        this.popover.load({
            event,
            element: this.popoverTriggerFor,
            width: this.popoverWidth,
            height: this.popoverHeight,
            placement: this.placement,
            popoverClass: this.popoverClass,
            theme: this.theme,
            offset: this.offset,
            animationDuration: this.animationDuration,
            animationTimingFunction: this.animationTimingFunction,
            animationTranslateY: this.animationTranslateY,
            padding: this.padding,
            zIndex: this.zIndex,
            noArrow: this.noArrow
        });
    }

    constructor(public popover: Popover) {

    }

    ngOnDestroy() {
        this.popover.close();
    }
}