import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import intervalToDuration from 'date-fns/intervalToDuration';
import fromUnixTime from 'date-fns/fromUnixTime';

@Pipe({ name: 'timeUntilPipe' })
export class TimeUntilPipe implements PipeTransform {
  transform(futureTimeUnix: number): string {
    const timeUntil = intervalToDuration({
      start: new Date(),
      end: new Date(futureTimeUnix * 1000)
    });

    return timeUntil.days + ' Days, ' + timeUntil.hours + ' hours';
  }
}
