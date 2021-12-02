import { Injectable, NgZone } from '@angular/core';
import { LiveStreamState, SseEvent } from '@core/interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  streamEventsSource: EventSource;

  constructor(private zone: NgZone) {}

  private createEventObserver<T>(source: EventSource) {
    return new Observable<SseEvent<T>>(observer => {
      // onmessage only fires for messages of event "message", i.e. no type
      // https://stackoverflow.com/a/9936764
      source.onmessage = (event: MessageEvent) => {
        console.log('message!');
        console.log(event);
        this.zone.run(() => { observer.next(JSON.parse(event.data) as SseEvent<T>)});
      }

      source.addEventListener(
        'message',
        (event: MessageEvent) => {
          console.log('event!');
          console.log(event);
          return this.zone.run(() => { observer.next(JSON.parse(event.data) as SseEvent<T>)});
        }
      );

      source.onerror = (event: MessageEvent) => {
        console.log('error!')
        console.log(event);
        // return this.zone.run(() => observer.error(event));
      }
    });
  }

  getStreamEvents(assetId: string) {
    this.streamEventsSource = new EventSource(`/api/sse/assets/${assetId}`);
    return this.createEventObserver<LiveStreamState>(this.streamEventsSource);
  }

  // For recieving events on myself!
  // getUserNotificationEvents(userId:string) {
  //   return this.createEventObserver<PerformanceState>(new EventSource(`${environment.sseUrl}/users/${userId}`))
  // }
}
