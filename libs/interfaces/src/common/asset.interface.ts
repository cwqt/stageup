// An asset refers to a piece of media content that is stored or is being live streamed through the Mux system.
// An asset always has a duration and one or more tracks (audio and video data).
// https://docs.mux.com/reference#assets
// We'll also have a type for S3 bucket items: images etc.
// for S3 asset_id = S3 key id

export const MAX_IMAGE_SIZE = 2048 as const; // 2meg
export const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'] as const;
export const ACCEPTED_VIDEO_MIME_TYPES = ['video/mp4'] as const;

import { LiveStreamState } from '../3rd-party/mux.interface';

export enum AssetType {
  // S3 ------------------------
  Image = 'image',
  // MUX -----------------------
  Thumbnail = 'thumbnail',
  AnimatedGIF = 'animated-gif',
  Storyboard = 'storyboard', // https://www.w3.org/TR/webvtt1/
  LiveStream = 'live-stream',
  Video = 'video'
}

export type AssetMetaUnion = {
  // S3 ------------------------
  [AssetType.Image]: {};
  // MUX -----------------------
  //https://docs.mux.com/reference#get-thumbnail
  [AssetType.Thumbnail]: {
    time: number;
    width: number;
    height: number;
    rotate: number;
    fit_mode: 'preserve' | 'stretch' | 'crop' | 'smartcrop' | 'pad';
    flip_v: boolean;
    flip_h: boolean;
  } & IMuxAsset;
  //https://docs.mux.com/reference#animated-gifs
  [AssetType.AnimatedGIF]: {
    start: number; // of GIF
    end: number; // end of GIF, delta t must be <= 10 seconds
    width: number; // in px
    height: number; // in px
    fps: number; // default 15, max 30
  } & IMuxAsset;
  [AssetType.Storyboard]: {};
  [AssetType.LiveStream]: { stream_key: string; state: LiveStreamState } & IMuxAsset;
  [AssetType.Video]: { presigned_upload_url: string } & IMuxAsset;
};

export type DtoAssetMeta = {
  // S3 ------------------------
  [AssetType.Image]: {};
  // MUX -----------------------
  [AssetType.Thumbnail]: {};
  [AssetType.AnimatedGIF]: {};
  [AssetType.Storyboard]: {};
  [AssetType.LiveStream]: { state: LiveStreamState };
  [AssetType.Video]: {};
};

export type IAssetStub<T extends keyof AssetMetaUnion = any> = {
  _id: string;
  type: T;
  location: string;
  tags: AssetTag[];
};

export const AssetTags = ['primary', 'secondary', 'trailer', 'thumbnail'];
export type AssetTag = typeof AssetTags[number];

// what gets sent to the client in IPerformance
export type AssetDto<T extends keyof AssetMetaUnion = any> = IAssetStub<T> & DtoAssetMeta[T] & { is_signed: boolean };

export interface IAsset<T extends keyof AssetMetaUnion = any> extends IAssetStub<T> {
  asset_identifier: string; // either MUX object_id or S3 key_id
  created_at: number;
  meta: AssetMetaUnion[T];
}

export interface IMuxAsset {
  playback_id: string;
}
