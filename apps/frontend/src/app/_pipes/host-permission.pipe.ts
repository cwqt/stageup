import { Pipe, PipeTransform } from '@angular/core';
import { HostPermission } from '@core/interfaces';

@Pipe({ name: 'hostPermissionPipe' })
export class HostPermissionPipe implements PipeTransform {
  transform(value: any): string {
    const prettyValues: { [index in HostPermission]: string } = {
      [HostPermission.Owner]: 'Owner',
      [HostPermission.Admin]: 'Admin',
      [HostPermission.Editor]: 'Editor',
      [HostPermission.Member]: 'Member',
      [HostPermission.Pending]: 'Pending',
      [HostPermission.Expired]: 'Expired'
    };

    return prettyValues[value] || 'Unknown Step';
  }
}
