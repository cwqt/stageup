import { IHostStub } from '../hosts/host.interface';
import { ISigningKey } from './signing-key.interface';

import { Genre } from './genres.interface';
import { DtoAccessToken, JwtAccessToken } from './access-token.interface';
import { ITicketStub } from './ticket.interface';
import { AssetType, IAsset, IAssetStub } from '../common/asset.interface';
import { IEnvelopedData } from '../common/envelope.interface';
import { LiveStreamState } from '../3rd-party/mux.interface';
import { NUUID } from '../common/fp.interface';

export enum Visibility {
  Public = 'public',
  Private = 'private'
}
export interface IPerformanceStub {
  _id: NUUID;
  host: IHostStub; // who created the performance
  name: string; // title of performance
  description?: string; // description of performance
  average_rating: number; // average rating across all ratings
  views: number; // total user view count
  created_at: number;
  stream: { state: LiveStreamState; location: IAsset<AssetType.LiveStream>['location'] };


  thumbnail:string;
}

export interface IPerformance extends IPerformanceStub {
  visibility: Visibility;
  premiere_date?: number; // when the performance is ready to be streamed
  genre: Genre;
  tickets: ITicketStub[];
  assets: IAssetStub[];
}

export type DtoPerformance = IEnvelopedData<IPerformance, { has_purchased: boolean; token: JwtAccessToken }>;

// data transfer object
export type DtoCreatePerformance = Pick<Required<IPerformance>, 'name' | 'premiere_date' | 'description' | 'genre'>;

// private to host
export interface IPerformanceHostInfo {
  stream_key: string;
  signing_key?: Omit<ISigningKey, 'rsa256_key'>;
}

export interface IPerformanceUserInfo {
  access_token: DtoAccessToken;
  has_liked?: boolean;
}