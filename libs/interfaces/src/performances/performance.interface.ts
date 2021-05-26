import { Asset } from '@mux/mux-node';
import { DeltaOperation } from 'quill';
import { Except } from 'type-fest';
import { AssetDto, AssetType, IAssetStub } from '../common/asset.interface';
import { IEnvelopedData } from '../common/envelope.interface';
import { NUUID } from '../common/fp.interface';
import { IHostStub } from '../hosts/host.interface';
import { DtoAccessToken } from './access-token.interface';
import { Genre } from './genres.interface';
import { ISigningKey } from './signing-key.interface';
import { ITicketStub } from './ticket.interface';

export type ParsedRichText = { ops: DeltaOperation[] }; // stringified-json
export type RichText = string;

export enum Visibility {
  Public = 'public',
  Private = 'private'
}

export interface IPerformanceStub {
  _id: NUUID;
  host: IHostStub; // who created the performance
  name: string; // title of performance
  description?: RichText; // description of performance
  average_rating: number; // average rating across all ratings
  views: number; // total user view count
  created_at: number;
  assets: IAssetStub[];

  thumbnail: string;
}

export interface IPerformance extends IPerformanceStub {
  visibility: Visibility;
  premiere_datetime?: number; // when the performance is ready to be streamed
  genre: Genre;
  tickets: ITicketStub[];
  assets: IAssetStub[];
}

export type DtoPerformance = IEnvelopedData<Except<IPerformance, 'assets'> & { assets: AssetDto[] }, null>;

// data transfer object
export type DtoCreatePerformance = Pick<
  Required<IPerformance>,
  'name' | 'premiere_datetime' | 'description' | 'genre'
> & { type: 'vod' | 'live' };

// private to host
export interface IPerformanceHostInfo {
  stream_key: string;
  signing_key?: Omit<ISigningKey, 'rsa256_key'>;
}

export interface IPerformanceUserInfo {
  access_token: DtoAccessToken;
  has_liked?: boolean;
}
