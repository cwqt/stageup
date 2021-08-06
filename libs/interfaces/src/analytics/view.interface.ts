import { NUUID } from '../common/fp.interface';

export interface IView {
  viewed_at: number;
  user__id: NUUID;
  asset__id: NUUID;
  performance__id: NUUID; //short circuit key
}
