import { DeltaOperation } from 'quill';
import { Except } from 'type-fest';

import {
  AssetDto,
  ConsentOpt,
  DtoAccessToken,
  Genre,
  IAssetStub,
  IEnvelopedData,
  IHostStub,
  ISigningKey,
  ITicketStub,
  NUUID,
  PlatformConsentOpt
} from '@core/interfaces';

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

export enum PerformanceType {
  Live = 'live',
  Vod = 'vod'
}

export enum RemovalReason {
  TechnicalIssues = 'technical_issues',
  CancelledResceduled = 'cancelled_rescheduled',
  Covid19 = 'covid_19',
  TooFewSold = 'too_few_sold',
  PoorUserExperience = 'poor_user_experience',
  Other = 'other'
}

export enum RemovalType {
  Cancel,
  SoftDelete
}

export interface IRemovalReason {
  removal_reason: RemovalReason;
  further_info: string;
}

export interface DtoRemovePerformance {
  removal_reason: IRemovalReason;
  removal_type: RemovalType;
}

export interface IPerformanceStub {
  _id: NUUID;
  host: IHostStub; // who created the performance
  name: string; // title of performance
  short_description?: RichText; // description of performance
  long_description?: RichText; // description of performance
  rating_count: number; // Total scores accumulated
  rating_total: number; // Number of ratings
  views: number; // total user view count
  like_count: number; // total user likes
  created_at: number;
  assets?: IAssetStub[];
  thumbnail: string;
  status: PerformanceStatus;
  performance_type: PerformanceType;
  publicity_period: { start: number; end: number }; // unix timestamps
  visibility: Visibility;
}

export interface IFeedPerformanceStub extends IPerformanceStub {
  client_likes?: boolean;
}

export interface IPerformance extends IPerformanceStub {
  visibility: Visibility;
  genre: Genre;
  tickets: ITicketStub[];
  assets: IAssetStub[];
}

// TODO: Add 'ticket visibility schedule', 'access duration', 'event showings', 'short description' and 'long description'
export type DtoPerformanceDetails = Pick<
  IPerformance,
  'name' | 'short_description' | 'long_description' | 'genre' | 'publicity_period' | 'visibility'
>;

// Interface for additional client information regarding the performance.
export interface IClientPerformanceData {
  is_following: boolean;
  is_liking: boolean;
  rating: number | null;
  host_marketing_opt_status: ConsentOpt | null;
  platform_marketing_opt_status: PlatformConsentOpt | null;
  has_bought_ticket_for: boolean;
}

export type DtoPerformance = IEnvelopedData<
  Except<IPerformance, 'assets'> & { assets: AssetDto[] },
  IClientPerformanceData
>;

// private to host
export interface IPerformanceHostInfo {
  stream_key: string;
  signing_key?: Omit<ISigningKey, 'rsa256_key'>;
}

export interface IPerformanceUserInfo {
  access_token: DtoAccessToken;
  has_liked?: boolean;
}
