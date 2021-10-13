import { NUUID } from '../common/fp.interface';

// Different pages/locations that a user can like a performance from
export enum LikeLocation {
  Thumb = 'thumbnail',
  Performance = 'video',
  Brochure = 'brochure',
  HostProfile = 'host-profile'
}

export interface ILike {
  user_id: NUUID;
  target_id: NUUID;
  target_type: LikeLocation;
}
