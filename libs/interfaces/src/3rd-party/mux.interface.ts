import { Upload } from '@mux/mux-node';
import { Except } from 'type-fest';
import { AssetTag, AssetType } from '../assets/asset.interface';

export enum VideoAssetState {
  Created = 'video.asset.created',
  Ready = 'video.asset.ready',
  Errored = 'video.asset.errored',
  Updated = 'video.asset.updated',
  Deleted = 'video.asset.deleted'
}

export enum StaticRendState {
  Ready = 'video.asset.static_renditions.ready',
  Preparing = 'video.asset.static_renditions.preparing',
  Deleted = 'video.asset.static_renditions.deleted',
  Errored = 'video.asset.static_renditions.errored'
}

export enum MasterState {
  Ready = 'video.asset.master.ready',
  Preparing = 'video.asset.master.preparing',
  Deleted = 'video.asset.master.deleted',
  Errored = 'video.asset.master.errored'
}

export enum TrackState {
  Created = 'video.asset.track.created',
  Ready = 'video.asset.track.ready',
  Errored = 'video.asset.track.errored',
  Deleted = 'video.asset.track.deleted'
}

export enum VideoUploadState {
  AssetCreated = 'video.upload.asset_created',
  Cancelled = 'video.upload.cancelled',
  Created = 'video.upload.created',
  Errored = 'video.upload.errored'
}

export enum LiveStreamState {
  Completed = 'video.asset.live_stream_completed',
  Created = 'video.live_stream.created',
  Connected = 'video.live_stream.connected',
  Recording = 'video.live_stream.recording',
  Active = 'video.live_stream.active',
  Disconnected = 'video.live_stream.disconnected',
  Idle = 'video.live_stream.idle',
  Updated = 'video.live_stream.updated',
  Enabled = 'video.live_stream.enabled',
  Disabled = 'video.live_stream.deleted'
}

export type MuxHook = LiveStreamState | VideoUploadState | TrackState | MasterState | StaticRendState | VideoAssetState;

export interface IMUXHookResponse<T = any> {
  type: MuxHook;
  created_at: Date;
  object: {
    type: 'asset' | 'track' | 'upload' | 'live' | 'simulcast-target';
    id: string;
  };
  id: string;
  environment: {
    name: string;
    id: string;
  };
  data: T;
  attempts: Array<{
    address: string;
    created_at: Date;
    id: string;
    max_attempts: number;
    response_body: string;
    response_headers: object;
    reponse_status_code: number;
    webhook_id: number;
  }>;
}

export interface DtoCreateAsset {
  is_signed: boolean;
  type: AssetType;
  tags: AssetTag[];
}

export interface ICreateAssetRes {
  upload_url: Upload['url'];
}

export enum AssetOwnerType {
  Performance,
  Host,
  User
}

export type IMuxPassthroughOwnerInfo = Except<IMuxPassthrough, 'asset_id' | 'asset_group_id'>;

export interface IMuxPassthrough {
  asset_id: string;
  asset_group_id: string;
  asset_owner_type: AssetOwnerType;
  asset_owner_id: string;
}
