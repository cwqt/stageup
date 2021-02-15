import { IUserStub } from '../users/user.interface';

export interface IRating {
  _id: string;
  created_at: number;
  rating: 1 | 2 | 3 | 4 | 5; // 1-5 star rating system
  comment?: string; // user review
  user: IUserStub; // who made the review
}
