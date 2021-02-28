import { BaseEntity, Entity, Column, BeforeInsert, PrimaryColumn } from 'typeorm';
import { IAsset, IAssetMeta, IGIFMeta, AssetType, IThumbnailMeta, IStaticMeta, Primitive } from '@core/interfaces';
import { stitchParameters, timestamp, uuid } from '@core/shared/helpers';
import { Except } from 'type-fest';

@Entity()
export class Asset<T> extends BaseEntity implements IAsset<T> {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column('timestamp') created_at: number;
  @Column('enum', { enum: AssetType }) asset_type: AssetType;
  @Column('jsonb') asset_meta: IAssetMeta<T>;

  constructor(assetType: AssetType, assetMeta: IAssetMeta<T>) {
    super();
    this.created_at = timestamp(new Date());
    this.asset_type = assetType;
    this.asset_meta = assetMeta;
  }

  getEndpoint(S3_URL:string, MUX_IMAGE_API_ENDPOINT:string): string {
    // Hack the typing a little
    const meta = this.asset_meta.data as unknown;
    const endpointMappers: { [index in AssetType]?: string } = {
      [AssetType.Image]: `http://${S3_URL}.com/${(meta as IStaticMeta).key_id}`,
      [AssetType.Thumbnail]: this.createThumbnailUrl(meta as IThumbnailMeta, MUX_IMAGE_API_ENDPOINT),
      [AssetType.AnimatedGIF]: this.createGIFUrl(meta as IGIFMeta, MUX_IMAGE_API_ENDPOINT)
    };

    return endpointMappers[this.asset_type];
  }

  createThumbnailUrl = (assetMeta: IThumbnailMeta, MUX_IMAGE_API_ENDPOINT:string): string => {
    const parameters: Except<IThumbnailMeta, 'playback_id'> = {
      width: assetMeta.width ?? 300,
      height: assetMeta.height ?? 300,
      flip_h: assetMeta.flip_h ?? false,
      flip_v: assetMeta.flip_v ?? false,
      rotate: assetMeta.rotate ?? 0,
      time: assetMeta.time ?? 0,
      fit_mode: assetMeta.fit_mode ?? 'smartcrop'
    };

    return `${MUX_IMAGE_API_ENDPOINT}/${assetMeta.playback_id}${stitchParameters(parameters)}`;
  };

  createGIFUrl = (assetMeta: IGIFMeta, MUX_IMAGE_API_ENDPOINT:string): string => {
    const parameters: Except<IGIFMeta, 'playback_id'> = {
      width: assetMeta.width ?? 300,
      height: assetMeta.height ?? 300,
      start: assetMeta.start ?? 0,
      end: assetMeta.end ?? 0,
      fps: assetMeta.fps ?? 15
    };

    return `${MUX_IMAGE_API_ENDPOINT}/${assetMeta.playback_id}/${stitchParameters(parameters)}`;
  };
}
