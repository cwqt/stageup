import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  Input,
  ChangeDetectorRef,
  AfterContentChecked,
  ChangeDetectionStrategy
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'ui-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss', './style.css']
})
export class IconComponent implements OnInit {
  @ViewChild('icon') private icon: ElementRef;
  @Input() size: 's' | 'm' | 'l' = 'm';
  dimensionMap = {
    s: 16,
    m: 24,
    l: 32
  };

  // like thumbs-up--filled
  glyph: string = '';

  // Use manual change detection
  constructor(private ref: ChangeDetectorRef, private renderer: Renderer2) {
    this.ref.detach();
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    // Get the elementRef
    this.ref.detectChanges();
    this.setIcon();
  }

  setIcon() {
    this.glyph = this.icon.nativeElement.textContent;
    this.icon.nativeElement.textContent = '';

    const dimension = this.dimensionMap[this.size];
    this.renderer.setStyle(this.icon.nativeElement, 'max-width', `${dimension}px`);
    this.renderer.setStyle(this.icon.nativeElement, 'max-height', `${dimension}px`);
    this.renderer.setStyle(this.icon.nativeElement, 'font-size', `${dimension}px`);

    // Now update the view
    this.ref.detectChanges();
  }
}
