import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IAsset, IAssetMeta, IGIFMeta, AssetType, IThumbnailMeta, IStaticMeta, Primitive } from '@eventi/interfaces';
import config from '../config';
import { timestamp } from '../common/helpers';
import { Except } from 'type-fest';

@Entity()
export class Asset<T> extends BaseEntity implements IAsset<T> {
  @PrimaryGeneratedColumn() _id: number;
  @Column('timestamp') created_at: number;
  @Column('enum', { enum: AssetType }) asset_type: AssetType;
  @Column('jsonb') asset_meta: IAssetMeta<T>;

  constructor(assetType: AssetType, assetMeta: IAssetMeta<T>) {
    super();
    this.created_at = timestamp(new Date());
    this.asset_type = assetType;
    this.asset_meta = assetMeta;
  }

  getEndpoint(): string {
    // Hack the typing a little
    const meta = this.asset_meta.data as unknown;
    const endpointMappers: { [index in AssetType]?: string } = {
      [AssetType.Image]: `http://${config.AWS.S3_URL}.com/${(meta as IStaticMeta).key_id}`,
      [AssetType.Thumbnail]: this.createThumbnailUrl(meta as IThumbnailMeta),
      [AssetType.AnimatedGIF]: this.createGIFUrl(meta as IGIFMeta)
    };

    return endpointMappers[this.asset_type];
  }

  createThumbnailUrl = (assetMeta: IThumbnailMeta): string => {
    const parameters: Except<IThumbnailMeta, 'playback_id'> = {
      width: assetMeta.width ?? 300,
      height: assetMeta.height ?? 300,
      flip_h: assetMeta.flip_h ?? false,
      flip_v: assetMeta.flip_v ?? false,
      rotate: assetMeta.rotate ?? 0,
      time: assetMeta.time ?? 0,
      fit_mode: assetMeta.fit_mode ?? 'smartcrop'
    };

    return `${config.MUX.IMAGE_API_ENDPOINT}/${assetMeta.playback_id}${stitchParameters(parameters)}`;
  };

  createGIFUrl = (assetMeta: IGIFMeta): string => {
    const parameters: Except<IGIFMeta, 'playback_id'> = {
      width: assetMeta.width ?? 300,
      height: assetMeta.height ?? 300,
      start: assetMeta.start ?? 0,
      end: assetMeta.end ?? 0,
      fps: assetMeta.fps ?? 15
    };

    return `${config.MUX.IMAGE_API_ENDPOINT}/${assetMeta.playback_id}/${stitchParameters(parameters)}`;
  };
}

// Join kv's and uri escape
const stitchParameters = (input: { [index: string]: Primitive }): string => {
  return Object.entries(input).reduce((accumulator, current, index) => {
    return accumulator + `${index === 0 ? '?' : '&'}${current[0]}=${current[1].toString()}`;
  }, '');
};
