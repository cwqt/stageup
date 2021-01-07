import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IAsset, IAssetMeta, IGIFMeta, AssetType, IThumbnailMeta, IStaticMeta, Primitive } from '@eventi/interfaces';
import config from '../config';
import { unixTimestamp } from '../common/helpers';

@Entity()
export class Asset<T> extends BaseEntity implements IAsset<T> {
  @PrimaryGeneratedColumn() _id: number;
  @Column()                 created_at: number;
  @Column()                 asset_type: AssetType;
  @Column('jsonb')          asset_meta: IAssetMeta<T>;

  constructor(assetType: AssetType, assetMeta: IAssetMeta<T>) {
    super();
    this.created_at = unixTimestamp(new Date());
    this.asset_type = assetType;
    this.asset_meta = assetMeta;
  }

  getEndpoint(): string {
    // hack the typing a little
    const meta = this.asset_meta.data as unknown;
    const endpointMappers: { [index in AssetType]?: string } = {
      [AssetType.Image]: `http://INSERT_S3_URL_HERE.com/${(<IStaticMeta>meta).key_id}`,
      [AssetType.Thumbnail]: this.createThumbnailUrl(<IThumbnailMeta>meta),
      [AssetType.AnimatedGIF]: this.createGIFUrl(<IGIFMeta>meta),
    };

    return endpointMappers[this.asset_type];
  }

  createThumbnailUrl = (assetMeta: IThumbnailMeta): string => {
    const params: Omit<IThumbnailMeta, 'playback_id'> = {
      width: assetMeta.width ?? 300,
      height: assetMeta.height ?? 300,
      flip_h: assetMeta.flip_h ?? false,
      flip_v: assetMeta.flip_v ?? false,
      rotate: assetMeta.rotate ?? 0,
      time: assetMeta.time ?? 0,
      fit_mode: assetMeta.fit_mode ?? 'smartcrop',
    };
  
    return `${config.MUX.IMAGE_API_ENDPOINT}/${assetMeta.playback_id}${stitchParams(params)}`;
  };
  
  createGIFUrl = (assetMeta: IGIFMeta): string => {
    const params: Omit<IGIFMeta, 'playback_id'> = {
      width: assetMeta.width ?? 300,
      height: assetMeta.height ?? 300,
      start: assetMeta.start ?? 0,
      end: assetMeta.end ?? 0,
      fps: assetMeta.fps ?? 15,
    };
  
    return `${config.MUX.IMAGE_API_ENDPOINT}/${assetMeta.playback_id}/${stitchParams(params)}`;
  };
}

// join kv's and uri escape
const stitchParams = (input: { [index: string]: Primitive }): string => {
  return Object.entries(input).reduce((acc, curr, idx) => {
    return acc + `${idx == 0 ? '?' : '&'}${curr[0]}=${curr[1]}`;
  }, '');
};


