import { AssetDto, AssetType, IMuxPassthroughOwnerInfo } from '@core/interfaces';
import { CreateUploadParams, LiveStream, Upload } from '@mux/mux-node';
import { EntityManager } from 'typeorm';
import BlobProvider from '../../../data-client/providers/blob.provider';
import MuxProvider from '../../../data-client/providers/mux.provider';

export type AssetProvider = {
  [AssetType.Image]: BlobProvider;
  [AssetType.AnimatedGIF]: MuxProvider;
  [AssetType.LiveStream]: MuxProvider;
  [AssetType.Thumbnail]: MuxProvider;
  [AssetType.Video]: MuxProvider;
  [AssetType.Storyboard]: MuxProvider;
};

export type AssetOptions = {
  [AssetType.Image]: {
    s3_url: string;
  };
  [AssetType.Video]: CreateUploadParams;
  [AssetType.AnimatedGIF]: void;
  [AssetType.LiveStream]: void;
  [AssetType.Thumbnail]: void;
  [AssetType.Storyboard]: void;
};

export type AssetObject = {
  [AssetType.Video]: Upload;
  [AssetType.LiveStream]: LiveStream;
  [AssetType.Image]: null;
  [AssetType.AnimatedGIF]: null;
  [AssetType.Thumbnail]: null;
  [AssetType.Storyboard]: null;
};

export interface AssetMethods<T extends AssetType> {
  setup: (
    provider: AssetProvider[T],
    options: AssetOptions[T],
    owner: IMuxPassthroughOwnerInfo,
    txc: EntityManager
  ) => Promise<AssetObject[T]>;
  delete: (provider: AssetProvider[T]) => Promise<void>;
  getLocation: (options: AssetOptions[T]) => string;
  toDto: () => Required<AssetDto<T>>;
}
