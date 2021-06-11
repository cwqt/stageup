import { Pipe, PipeTransform } from '@angular/core';
import { HostPermission } from '@core/interfaces';

@Pipe({ name: 'hostPermissionPipe' })
export class HostPermissionPipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in HostPermission]: string } = {
      [HostPermission.Owner]: $localize`Owner`,
      [HostPermission.Admin]: $localize`Admin`,
      [HostPermission.Editor]: $localize`Editor`,
      [HostPermission.Member]: $localize`Member`,
      [HostPermission.Pending]: $localize`Pending`,
      [HostPermission.Expired]: $localize`Expired`
    };

    return prettyValues[value] || $localize`Unknown Step`;
  }
}
