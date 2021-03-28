export enum MUXHook {
  VideoAssetCreated = 'video.asset.created',
  VideoAssetReady = 'video.asset.ready',
  VideoAssetErrored = 'video.asset.errored',
  VideoAssetUpdated = 'video.asset.updated',
  VideoAssetDeleted = 'video.asset.deleted',

  StaticRendReady = 'video.asset.static_renditions.ready',
  StaticRendPreparing = 'video.asset.static_renditions.preparing',
  StaticRendDeleted = 'video.asset.static_renditions.deleted',
  StaticRendErrored = 'video.asset.static_renditions.errored',

  MasterReady = 'video.asset.master.ready',
  MasterPreparing = 'video.asset.master.preparing',
  MasterDeleted = 'video.asset.master.deleted',
  MasterErrored = 'video.asset.master.errored',

  TrackCreated = 'video.asset.track.created',
  TrackReady = 'video.asset.track.ready',
  TrackErrored = 'video.asset.track.errored',
  TrackDeleted = 'video.asset.track.deleted',

  UploadAssetCreated = 'video.upload.asset_created',
  UploadCancelled = 'video.upload.cancelled',
  UploadCreated = 'video.upload.created',
  UploadErrored = 'video.upload.errored',

  StreamCompleted = 'video.asset.live_stream_completed',
  StreamCreated = 'video.live_stream.created',
  StreamConnected = 'video.live_stream.connected',
  StreamRecording = 'video.live_stream.recording',
  StreamActive = 'video.live_stream.active',
  StreamDisconnected = 'video.live_stream.disconnected',
  StreamIdle = 'video.live_stream.idle',
  StreamUpdated = 'video.live_stream.updated',
  StreamEnabled = 'video.live_stream.enabled',
  StreamDisabled = 'video.live_stream.deleted',
}

export interface IMUXHookResponse<T=any> {
  type: MUXHook;
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
