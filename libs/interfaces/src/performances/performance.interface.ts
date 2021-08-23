import { DeltaOperation } from 'quill';
import { Except } from 'type-fest';
import { DtoAccessToken } from '../assets/access-token.interface';
import { AssetDto, IAssetStub } from '../assets/asset.interface';
import { ISigningKey } from '../assets/signing-key.interface';
import { IEnvelopedData } from '../common/envelope.interface';
import { NUUID } from '../common/fp.interface';
import { ConsentOpt } from '../gdpr/consent.interface';
import { IHostStub } from '../hosts/host.interface';
import { Genre } from './genres.interface';
import { ITicketStub } from './ticket.interface';

export type ParsedRichText = { ops: DeltaOperation[] }; // stringified-json
export type RichText = string;

export enum Visibility {
  Public = 'public',
  Private = 'private'
}

export enum PerformanceStatus {
  Complete = 'complete',
  Live = 'live',
  Scheduled = 'scheduled',
  Deleted = 'deleted',
  Cancelled = 'cancelled',
  PendingSchedule = 'pending_schedule'
}

export enum DeletePerfReason {
  TechnicalIssues = 'technical_issues',
  CancelledResceduled = 'cancelled_rescheduled',
  Covid19 = 'covid_19',
  TooFewSold = 'too_few_sold',
  PoorUserExperience = 'poor_user_experience',
  Other = 'other'
}

export interface IDeletePerfReason {
  delete_reason: DeletePerfReason;
  further_info: string;
}

export interface IPerformanceStub {
  _id: NUUID;
  host: IHostStub; // who created the performance
  name: string; // title of performance
  description?: RichText; // description of performance
  rating_count: number; // Total scores accumulated
  rating_total: number; // Number of ratings
  premiere_datetime?: number; // when the performance is ready to be streamed
  views: number; // total user view count
  like_count: number; // total user likes
  created_at: number;
  assets?: IAssetStub[];
  thumbnail: string;
  status: PerformanceStatus;
}

export interface IFeedPerformanceStub extends IPerformanceStub {
  client_likes?: boolean;
}

export interface IPerformance extends IPerformanceStub {
  visibility: Visibility;
  genre: Genre;
  tickets: ITicketStub[];
  assets: IAssetStub[];
  publicity_period: { start: number; end: number }; // unix timestamps
}

// Interface for additional client information regarding the performance.
export interface IClientPerformanceData {
  is_following: boolean;
  is_liking: boolean;
  rating: number | null;
  host_marketing_opt_status: ConsentOpt | null;
}

export type DtoPerformance = IEnvelopedData<
  Except<IPerformance, 'assets'> & { assets: AssetDto[] },
  IClientPerformanceData
>;

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
