import { Blobs, BlobUploadResponse } from '@core/api';
import { AssetDto, AssetType, IMuxPassthroughOwnerInfo } from '@core/interfaces';
import Mux, { CreateUploadParams, LiveStream, Upload } from '@mux/mux-node';
import { EntityManager } from 'typeorm';

export type AssetProvider = {
  [AssetType.Image]: Blobs;
  [AssetType.AnimatedGIF]: Mux;
  [AssetType.LiveStream]: Mux;
  [AssetType.Thumbnail]: Mux;
  [AssetType.Video]: Mux;
  [AssetType.Storyboard]: Mux;
};

export type AssetOptions = {
  [AssetType.Image]: {
    file: Express.Multer.File; // data of the image
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
  [AssetType.Image]: BlobUploadResponse;
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
  getLocation: () => string;
  toDto: () => Required<AssetDto<T>>;
}
