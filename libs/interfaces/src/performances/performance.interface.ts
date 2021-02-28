import { IHostStub } from '../hosts/host.interface';
import { IRating } from './performance-review.interface';
import { ISigningKey } from './signing-key.interface';
import { CurrencyCode } from '../common/currency.interface';
import { Genre } from './genres.interface';
import { IPerformancePurchase } from './performance-purchase.interface';

export interface IPerformanceStub {
  _id: string;
  host: IHostStub; // who created the performance
  name: string; // title of performance
  description?: string; // description of performance
  average_rating: number; // average rating across all ratings
  views: number; // total user view count
  playback_id: string; // address to view
}

export interface IPerformance extends IPerformanceStub {
  premiere_date?: number; // when the performance is ready to be streamed
  ratings: IRating[]; // user ratings on performance
  state: PerformanceState; // status of stream
  price: number; // cost to purchase (micro-pence)
  currency: CurrencyCode; // currency of price
  genre: Genre;
  is_private: boolean; // accessible only to host members 
  created_at: number;
}

// data transfer object
export type DtoCreatePerformance = Pick<Required<IPerformance>, 'name' | 'premiere_date' | 'description' | 'genre' | "price" | "currency">;

// private to host
export interface IPerformanceHostInfo {
  stream_key: string;
  signing_key?: Omit<ISigningKey, 'rsa256_key'>;
}

export interface IPerformanceUserInfo {
  signed_token: string;
  expires: boolean;
  purchase_id: IPerformancePurchase["_id"];
}

export enum PerformanceState {
  //https://docs.mux.com/docs/live-streaming
  Connected = 'video.live_stream.connected',
  Disconnected = 'video.live_stream.disconnected',
  Recording = 'video.live_stream.recording',
  Active = 'video.live_stream.active',
  Idle = 'video.live_stream.idle',
  StreamCompleted = 'video.asset.live_stream_completed'
}
