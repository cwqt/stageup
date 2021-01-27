import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'objectLengthPipe' })
export class ObjectLengthPipe implements PipeTransform {
  transform(value: Object): string {
    return Object.keys(value).length.toString();
  }
}
