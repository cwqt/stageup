import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PerformanceService } from '@frontend/services/performance.service';
import { LikeLocation } from '@core/interfaces';

@Component({
  selector: 'app-like-performance',
  templateUrl: './like-performance.component.html',
  styleUrls: ['./like-performance.component.scss']
})
export class LikePerformanceComponent implements OnInit {
  @Input() userLiked: boolean; // If the current user has liked this performance
  @Input() performanceId: string; // ID of performance
  @Input() location: LikeLocation; // Location of the like button ('brochure', 'thumbnail', or 'video')
  @Input() likeCount?: number; // Total number of likes (from all locations). This input is optional.

  @Output() onLikeEvent = new EventEmitter();

  countToDisplay: string | number; // Formatted number to display (possibly string since it might include 'K' at the end).

  constructor(private performanceService: PerformanceService) {}

  ngOnInit(): void {
    // If like count is provided, format it for large numbers (e.g. 1.1K)
    if (this.likeCount !== undefined) this.countToDisplay = this.formatCount(this.likeCount);
  }

  // Add or remove a like from the database and the counter
  async likeEvent() {
    await this.performanceService.toggleLike(this.performanceId, this.location);
    this.userLiked ? this.updateCount(-1) : this.updateCount(1);
    this.userLiked = !this.userLiked;
    this.onLikeEvent.emit(this.userLiked);
  }

  // Updates count for the user interface. If no count provided it simply returns.
  updateCount(amount: number): void {
    if (this.likeCount === undefined) return;
    else {
      this.likeCount = this.likeCount + amount;
      this.countToDisplay = this.formatCount(this.likeCount);
    }
  }

  formatCount(count: number): string | number {
    // Numbers less than 1K are displayed in full.
    if (count < 1000) return count;
    else {
      // Numbers greater than 1K are rounded down to nearest 100.
      return Math.floor(count / 100) / 10 + 'K';
    }
  }
}
