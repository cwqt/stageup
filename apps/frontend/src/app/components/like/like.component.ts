import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PerformanceService } from '@frontend/services/performance.service';
import { LikeLocation } from '@core/interfaces';
import { HostService } from '@frontend/services/host.service';
//Generic like component, can be used to like both hosts and performances
@Component({
  selector: 'app-like',
  templateUrl: './like.component.html',
  styleUrls: ['./like.component.scss']
})
export class LikeComponent implements OnInit {
  @Input() userLiked: boolean; // If the current user has liked this likeable entity
  @Input() location: LikeLocation; // Location of the like button ('brochure', 'thumbnail', or 'video')
  @Input() likeCount?: number; // Total number of likes (from all locations). This input is optional.
  @Output() onLike = new EventEmitter();
  countToDisplay: string | number; // Formatted number to display (possibly string since it might include 'K' at the end).

  constructor() {}

  ngOnInit(): void {
    // If like count is provided, format it for large numbers (e.g. 1.1K)
    if (this.likeCount !== undefined) this.countToDisplay = this.formatCount(this.likeCount);
  }

  // Add or remove a like from the database and the counter
  async likeEvent() {
    this.userLiked ? this.updateCount(-1) : this.updateCount(1);
    this.userLiked = !this.userLiked;
    this.onLike.emit(this.userLiked);
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
