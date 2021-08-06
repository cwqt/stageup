import { Except } from 'type-fest';
import { NUUID } from '../common/fp.interface';

export interface IFollow {
  _id: NUUID;
  follow_date: number;
  user__id: NUUID;
  host__id: NUUID;
}

// Follows can be seen as from 2 perspectives. The host wants to see the users that follow them (and does not need their ID attached to each follow).
// Likewise, the user that follows multiple hosts does not want to have the user ID attached to each follow.
export type IFollower = Except<IFollow, 'host__id'>;
export type IFollowing = Except<IFollow, 'user__id'>;
