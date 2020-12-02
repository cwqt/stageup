import {Component, ElementRef, EventEmitter, Input, ComponentFactoryResolver, ViewChild, HostBinding, Renderer2} from '@angular/core';

import {ComponentProperties, OverlayProperties} from '@ivylab/overlay-angular';
import {AdDirective} from './ad.directive';

@Component({
    selector: 'popover-container',
    templateUrl: './popover.component.html',
    styleUrls: ['./popover.component.sass']
})
export class PopoverComponent {
    popoverPosition = {
        left: '',
        top: ''
    };
    _properties: OverlayProperties;
    minTimeout: number = 0;

    @HostBinding('style.top') hostTop: string;
    @HostBinding('style.left') hostLeft: string;
    @HostBinding('style.padding')
    get hostPadding() {
        return this.properties.metadata.padding;
    }
    @HostBinding('class.popover-light') hostLight: boolean;
    @HostBinding('class.popover-noarrow')
    get hostNoArrow() {
        return this.properties.metadata.noArrow;
    }

    @ViewChild(AdDirective, {static: true}) adHost: AdDirective;

    @Input() set overlayProperties(properties: OverlayProperties) {
        this._properties = properties;
    }

    get properties() {
        return this._properties;
    }

    get component() {
        return this.properties.childComponent;
    }

    get element() {
        return this.properties.metadata.element;
    }

    get srcElement() {
        if (this.properties.metadata.event) {
            return this.properties.metadata.event.srcElement;
        }
    }

    get data() {
        return this.properties.metadata.data;
    }

    get targetElement() {
        return this.properties.metadata.targetElement;
    }

    get placement() {
        return this.properties.metadata.placement;
    }

    get isAlignToCenter() {
        return this.properties.metadata.alignToCenter;
    }

    get isThemeLight() {
        return this.properties.metadata['theme'] === 'light';
    }

    get isArrow() {
        return this.isThemeLight && !this.hostNoArrow;
    }

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver,
        private renderer: Renderer2,
        private elementRef: ElementRef) {}

    ngOnInit() {
        setTimeout(() => {
            if (this.component) {
                this.loadComponent();
            } else if (this.element) {
                this.appendElement();
            }

            this.setPlacementClass();
            this.setThemeClass();
            this.setPosition(this.properties);
        }, this.minTimeout);
    }

    loadComponent() {
        let adItem = this.properties;
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(adItem.childComponent);
        let viewContainerRef = this.adHost.viewContainerRef;
        viewContainerRef.clear();
        let componentRef = viewContainerRef.createComponent(componentFactory);
    }

    appendElement() {
        this.element.style.display = '';
        document.getElementsByTagName('popover-container')[0].appendChild(this.element);
    }

    setPlacementClass(): void {
        this.renderer.addClass(this.elementRef.nativeElement, 'popover-' + this.placement);
    }

    setThemeClass(): void {
        this.hostLight = this.isThemeLight;
    }

    setPosition(properties) {
        const element = this.srcElement || this.targetElement;
        const elementPosition = element.getBoundingClientRect();
        const elementHeight = element.offsetHeight;
        const elementWidth = element.offsetWidth;
        const popoverHeight = this.elementRef.nativeElement.clientHeight;
        const popoverWidth = this.elementRef.nativeElement.clientWidth;
        const scrollY = window.pageYOffset;
        const placement = properties.metadata.placement;
        const offset = properties.metadata.offset;
        const arrowOffset = 16;
        const arrowWidth = 16;
        const offsetArrowCenter = arrowOffset + arrowWidth / 2;

        // Top - bottom
        if (placement === 'top' || 'top-left' || 'top-right') {
            this.hostTop = (elementPosition.top + scrollY) - (popoverHeight + offset) + 'px';
        }

        if (placement === 'top-right' || placement === 'bottom-right') {
            if (this.isAlignToCenter) {
                this.hostLeft = (elementPosition.left + elementWidth / 2 - offsetArrowCenter) + 'px';
            } else {
                this.hostLeft = elementPosition.left + 'px';
            }

        }

        if (placement === 'top-left' || placement === 'bottom-left') {
            if (this.isAlignToCenter) {
                this.hostLeft = (elementPosition.left) - (popoverWidth - elementWidth) - (elementWidth / 2 - offsetArrowCenter) + 'px';
            } else {
                this.hostLeft = (elementPosition.left) - (popoverWidth - elementWidth) + 'px';
            }
        }

        if (placement === 'bottom' || placement === 'bottom-right' || placement === 'bottom-left') {
            this.hostTop = (elementPosition.top + scrollY) + elementHeight + offset + 'px';
        }

        if (placement === 'top' || placement === 'bottom') {
            this.hostLeft = (elementPosition.left + elementWidth / 2) - popoverWidth / 2 + 'px';
        }

        // Left - right
        if (placement === 'left' || placement === 'left-bottom' || placement === 'left-top') {
            this.hostLeft = elementPosition.left - popoverWidth - offset + 'px';
        }

        if (placement === 'right' || placement === 'right-bottom' || placement === 'right-top') {
            this.hostLeft = elementPosition.left + elementWidth + offset + 'px';
        }

        if (placement === 'left' || placement === 'right') {
            this.hostTop = (elementPosition.top + scrollY) + elementHeight / 2 - popoverHeight / 2 + 'px';
        }

        if (placement === 'right-bottom' || placement === 'left-bottom') {
            if (this.isAlignToCenter) {
                this.hostTop = (elementPosition.top + scrollY) + (elementHeight / 2 - offsetArrowCenter) + 'px';
            } else {
                this.hostTop = (elementPosition.top + scrollY) + 'px';
            }
        }

        if (placement === 'right-top' || placement === 'left-top') {
            if (this.isAlignToCenter) {
                this.hostTop = (elementPosition.top + scrollY) + elementHeight - popoverHeight - (elementHeight / 2 - offsetArrowCenter) + 'px';
            } else {
                this.hostTop = (elementPosition.top + scrollY) + elementHeight - popoverHeight + 'px';
            }
        }
    }
}
