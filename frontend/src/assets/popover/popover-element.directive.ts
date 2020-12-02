import {Directive, ElementRef, HostBinding} from '@angular/core';
import {OverlayProperties} from '@ivylab/overlay-angular';

@Directive({
    selector: 'popover'
})

export class PopoverElementDirective {
    @HostBinding('style.display') hostDisplay: string;

    constructor(private elementRef: ElementRef) {
        this.hostDisplay = 'none';
    }
}