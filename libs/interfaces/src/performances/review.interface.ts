import { NUUID } from '@core/interfaces';

export interface IRating {
  _id: string;
  created_at: number;
  rating: number;
  comment?: string; // user review
  user__id: NUUID; // who made the review
  performance__id: NUUID; // the performance being rated
}
