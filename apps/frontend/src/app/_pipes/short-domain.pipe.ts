import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'shortDomain' })
export class ShortDomainPipe implements PipeTransform {
  transform(url: string): any {
    if (!url || url.length < 3) return url;

    // transform https://github.com/whasda into github.com
    let result:string;
    let match:string[];
    if ((match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^:\/\n?=]+)/im))) {
      result = match[1];
      if ((match = result.match(/^[^.]+\.(.+\..+)$/))) result = match[1];
    }
    
    return result;
  }
}
