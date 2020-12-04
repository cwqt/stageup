import { Component, OnInit } from '@angular/core';
import { IPerformanceStub } from '@eventi/interfaces';
import { ICacheable } from 'src/app/app.interfaces';
import { FeedService } from 'src/app/services/feed.service';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  performances:ICacheable<IPerformanceStub[]> = {
    data: [],
    error: "",
    loading: false
  }

  images = [
    "https://i.ytimg.com/vi/ebH57w1REgY/maxresdefault.jpg",
    "https://images1.purplesneakers.com.au/2020/04/95fdd4b7383dba06b5be1b781e8e0e09.png"
  ]

  constructor(private feedService:FeedService) { }

  ngOnInit(): void {
    this.getFeed();
  }

  getFeed() {
    this.performances.loading = true;
    this.feedService.getFeed()
      .then(p => this.performances.data = p)
      .catch(e => this.performances.error = e)
      .finally(() => this.performances.loading = false);
  }
}
