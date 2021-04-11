// An asset refers to a piece of media content that is stored or is being live streamed through the Mux system.
// An asset always has a duration and one or more tracks (audio and video data).
// https://docs.mux.com/reference#assets
// We'll also have a type for S3 bucket items: images etc.
// for S3 asset_id = S3 key id

import { LiveStreamState } from "../3rd-party/mux.interface";

export enum AssetType {
  Thumbnail = 'thumbnail',
  AnimatedGIF = 'animated-gif',
  Storyboard = 'storyboard', // https://www.w3.org/TR/webvtt1/
  Image = 'image',
  LiveStream = 'live-stream',
  Video = 'video'
}

export type AssetMetaUnion = {
  [AssetType.Image]: IStaticMeta;
  [AssetType.Thumbnail]: IThumbnailMeta;
  [AssetType.AnimatedGIF]: IGIFMeta;
  [AssetType.Storyboard]: IStaticMeta;
  [AssetType.LiveStream]: ILiveStreamMeta;
  [AssetType.Video]: {};
};

export interface IAsset<T extends keyof AssetMetaUnion=any> {
  _id: string;
  asset_identifier: string; // either MUX object_id or S3 key_id
  created_at: number;
  location: string; // where to find the asset, s3 mux
  type: T;
  meta: AssetMetaUnion[T];
}

export interface IMuxAsset {
  playback_id: string;
}

export interface ILiveStreamMeta extends IMuxAsset {
  stream_key: string;
  state: LiveStreamState;
}

//https://docs.mux.com/reference#animated-gifs
export interface IGIFMeta extends IMuxAsset {
  start: number; // of GIF
  end: number; // end of GIF, delta t must be <= 10 seconds
  width: number; // in px
  height: number; // in px
  fps: number; // default 15, max 30
}

//https://docs.mux.com/reference#get-thumbnail
export interface IThumbnailMeta extends IMuxAsset {
  time: number;
  width: number;
  height: number;
  rotate: number;
  fit_mode: 'preserve' | 'stretch' | 'crop' | 'smartcrop' | 'pad';
  flip_v: boolean;
  flip_h: boolean;
}

// S3 objects
export interface IStaticMeta {
  // key_id: string;
}
