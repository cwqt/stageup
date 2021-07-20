import { Component, Input, OnInit, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-rate-performance',
  templateUrl: './rate-performance.component.html',
  styleUrls: ['./rate-performance.component.scss']
})
export class RatePerformanceComponent implements OnInit, OnChanges {
  // All inputs are multiplied by the starCount and the output divided
  @Input('rating') rating: number;
  @Input('starCount') starCount: number;
  @Output() ratingUpdated = new EventEmitter();

  scoreToDisplay: number;

  constructor() {}

  ngOnInit() {}

  onClick(rating: number): void {
    this.ratingUpdated.emit(rating / this.starCount);
  }

  // Everytime input 'rating' changes, this will be triggered
  ngOnChanges() {
    this.scoreToDisplay = Math.round(this.rating * this.starCount);
  }

  loadIcon(index: number): string {
    if (this.scoreToDisplay >= index + 1) {
      return 'star';
    } else {
      return 'star_border';
    }
  }
}
