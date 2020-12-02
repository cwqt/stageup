import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {OverlayModule} from '@ivylab/overlay-angular';
import {PopoverComponent} from './popover.component';
import {AdDirective} from './ad.directive';
import {Popover} from './popover.service';
import {PopoverElementDirective} from './popover-element.directive';
import {PopoverTriggerDirective} from './popover-trigger.directive';

@NgModule({
    declarations: [
        PopoverComponent,
        AdDirective,
        PopoverElementDirective,
        PopoverTriggerDirective
    ],
    imports: [
        CommonModule,
        OverlayModule
    ],
    exports: [
        PopoverElementDirective,
        PopoverTriggerDirective
    ],
    providers: [
        Popover
    ],
    bootstrap: [],
    entryComponents: [
        PopoverComponent
    ]
})
export class PopoverModule {
}
