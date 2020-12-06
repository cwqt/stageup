// An asset refers to a piece of media content that is stored or is being live streamed through the Mux system.
// An asset always has a duration and one or more tracks (audio and video data).
// https://docs.mux.com/reference#assets
// We'll also have a type for S3 bucket items: images etc.
// for S3 asset_id = S3 key id

export enum AssetType {
  Thumbnail,
  AnimatedGIF,
  Storyboard, // https://www.w3.org/TR/webvtt1/
  Image,
  Stream,
  Video,
}

export interface IAsset<T> {
  _id: number;
  created_at: number;
  asset_type: AssetType;
  asset_meta: IAssetMeta<T>; //stored as JSON-B in postgres
}

// yo i heard you like metadata on your metadata dawg
export interface IAssetMeta<T> {
  data: T;
}

export interface IMUXAsset {
  playback_id: string;
}

//https://docs.mux.com/reference#animated-gifs
export interface IGIFMeta extends IMUXAsset {
  start: number; // of GIF
  end: number; // end of GIF, delta t must be <= 10 seconds
  width: number; // in px
  height: number; // in px
  fps: number; // default 15, max 30
}

//https://docs.mux.com/reference#get-thumbnail
export interface IThumbnailMeta extends IMUXAsset {
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
  key_id: string;
}
