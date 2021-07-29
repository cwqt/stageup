import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import intervalToDuration from 'date-fns/intervalToDuration';
import fromUnixTime from 'date-fns/fromUnixTime';

@Pipe({ name: 'timeUntilPipe' })
export class TimeUntilPipe implements PipeTransform {
  transform(value: number): string {
    const futureDate = fromUnixTime(value * 1000);
    console.log(value);

    const timeUntil = differenceInCalendarDays(new Date(value * 1000), new Date());

    console.log(timeUntil);

    return timeUntil.toString();
  }
}
