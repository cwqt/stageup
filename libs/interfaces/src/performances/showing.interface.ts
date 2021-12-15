import { NUUID } from '@core/interfaces';
import { Performance } from '@core/api';

export const ShowingCountLimit: number = 12;

export interface IShowing {
  _id: NUUID;
  start_datetime: number;
  end_datetime: number;
  performance: Performance;
}

export type DtoCreateShowing = Required<{
    start_datetime: number;
    end_datetime: number;
}>;