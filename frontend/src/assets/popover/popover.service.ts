import {Injectable, Injector, ComponentFactoryResolver, EmbeddedViewRef, ApplicationRef, ComponentRef, EventEmitter} from '@angular/core';

import {PopoverComponent} from './popover.component';
import {Overlay, OverlayProperties, EventService as OverlayEventService} from '@ivylab/overlay-angular';
import {PopoverProperties} from './interfaces';
import {defaultProperties} from './default-properties';

@Injectable()
export class Popover {
    _defaultProperties: OverlayProperties;

    constructor(
        public overlay: Overlay,
        private overlayEventService: OverlayEventService) {}

    public load(properties: PopoverProperties) {
        console.log(properties)
        properties = this.applyPropertieDefaults(defaultProperties, properties);

        this.overlay.load({
            id: 'popover',
            mainComponent: PopoverComponent,
            childComponent: properties.component,
            width: properties.width,
            height: properties.height,
            left: properties.left,
            top: properties.top,
            animationDuration: properties.animationDuration,
            animationTimingFunction: properties.animationTimingFunction,
            animationTranslateY: properties.animationTranslateY,
            zIndex: properties.zIndex,
            metadata: {
                data: properties.data,
                placement: properties.placement,
                alignToCenter: properties.alignToCenter,
                event: properties.event,
                element: properties.element,
                targetElement: properties.targetElement,
                offset: properties.offset,
                theme: properties.theme,
                popoverClass: properties.popoverClass,
                padding: properties.padding,
                noArrow: properties.noArrow
            },
        });
    }

    public close() {
        this.overlayEventService.emitChangeEvent({
            type: 'Hide'
        });
    }

    applyPropertieDefaults(defaultProperties, properties) {
        if (!properties) {
            properties = {};
        }
        /*
        if (!properties.index){ 
            properties.index = 0;
        }
        */

        for (var propertie in properties) {
            if (properties[propertie] === undefined) {
                delete properties[propertie];
            }
        }

        this._defaultProperties = Object.assign({}, defaultProperties);
        return Object.assign(this._defaultProperties, properties);
    }
}