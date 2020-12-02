export interface PopoverProperties {
    event?: MouseEvent;
    data?:any;
    relativeTo?:string;
    targetElement?: HTMLElement;
    element?: HTMLElement;
    component?: any;
    width?: string;
    height?: string;
    maxWidth?: string;
    maxHeight?: string;
    left?: string;
    top?: string;
    right?: string;
    bottom?: string;
    zIndex?: number;
    placement?: 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right' | 
    'left' | 'left-top' | 'left-bottom' | 'right' | 'right-top' | 'right-bottom';
    alignToCenter?: boolean;
    overlayBackdrop?: boolean;
    offset?: number;
    theme?: 'dark' | 'light';
    animationDuration?: number;
    animationTimingFunction?: string;
    animationTranslateY?: string;
    popoverClass?: string | string[];
    padding?: string;
    noArrow?: boolean;
    metadata?: any;
}