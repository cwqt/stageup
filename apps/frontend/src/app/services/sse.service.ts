import { Injectable, NgZone } from '@angular/core';
import { LiveStreamState, SseEvent } from '@core/interfaces';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  constructor(private zone: NgZone) {}

  private createEventObserver<T>(source: EventSource) {
    return new Observable<SseEvent<T>>(observer => {
      // onmessage only fires for messages of event "message", i.e. no type
      // https://stackoverflow.com/a/9936764
      source.onmessage = (event: MessageEvent) =>
        this.zone.run(() => observer.next(JSON.parse(event.data) as SseEvent<T>));

      source.onerror = (event: MessageEvent) => this.zone.run(() => observer.error(event));
    });
  }

  getStreamEvents(performanceId: string) {
    return this.createEventObserver<LiveStreamState>(
      new EventSource(`${environment.sseUrl}/performances/${performanceId}`)
    );
  }

  // For recieving events on myself!
  // getUserNotificationEvents(userId:string) {
  //   return this.createEventObserver<PerformanceState>(new EventSource(`${environment.sseUrl}/users/${userId}`))
  // }
}