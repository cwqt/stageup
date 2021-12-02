import { Genre } from '@core/interfaces';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'genrePipe'
})
export class GenrePipe implements PipeTransform {
  transform(value: Genre): string {
    const prettyValues: { [index in Genre]: string } = {
      [Genre.Dance]: $localize`Dance`,
      [Genre.Classical]: $localize`Classical`,
      [Genre.Contemporary]: $localize`Contemporary`,
      [Genre.Family]: $localize`Family`,
      [Genre.Theatre]: $localize`Theatre`,
      [Genre.Networking]: $localize`Networking`,
      [Genre.Ballet]: $localize`Ballet`,
      [Genre.Country]: $localize`Country Music`,
      [Genre.Music]: $localize`Music`,
      [Genre.Orchestra]: `Orchestral`,
      [Genre.Opera]: $localize`Opera`,
      [Genre.Poetry]: $localize`Poetry`
    };
    return prettyValues[value] || $localize`Unknown Genre`;
  }
}
