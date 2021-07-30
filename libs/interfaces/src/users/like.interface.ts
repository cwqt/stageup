import { NUUID } from '../common/fp.interface';

// Different pages/locations that a user can like a performance from
export enum LikeLocation {
  Thumb = 'thumbnail',
  Performance = 'video',
  Brochure = 'brochure'
}

export interface ILike {
  like_date: number;
  user__id: NUUID;
  performance__id: NUUID;
  like_location: LikeLocation;
}
