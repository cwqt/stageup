import { IAsset } from '../common/asset.interface';
import { NUUID } from '../common/fp.interface';
import { IUser } from '../users/user.interface';

export interface IView {
  viewed_at: number;
  user__id: NUUID;
  asset__id: NUUID;
  performance__id: NUUID; //short circuit key
}
