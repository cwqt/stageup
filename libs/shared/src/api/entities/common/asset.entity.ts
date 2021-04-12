import {
  BaseEntity,
  Entity,
  Column,
  BeforeInsert,
  PrimaryColumn,
  EntityManager,
  OneToOne,
  JoinColumn,
  ManyToOne
} from 'typeorm';
import {
  IAsset,
  AssetMetaUnion,
  IGIFMeta,
  AssetType,
  IThumbnailMeta,
  IMuxAsset,
  ILiveStreamMeta,
  LiveStreamState
} from '@core/interfaces';
import { stitchParameters, timestamp, to, uuid } from '@core/shared/helpers';
import { Except } from 'type-fest';
import Mux, { LiveStream } from '@mux/mux-node';
import { SigningKey } from '../performances/signing-key.entity';
import { AssetGroup } from './asset-group.entity';
import MuxProvider from '../../data-client/providers/mux.provider';
import S3Provider from '../../data-client/providers/aws-s3.provider';

type AssetProvider = {
  [AssetType.Image]: S3Provider;
  [AssetType.AnimatedGIF]: MuxProvider;
  [AssetType.LiveStream]: MuxProvider;
  [AssetType.Thumbnail]: MuxProvider;
  [AssetType.Video]: MuxProvider;
  [AssetType.Storyboard]: MuxProvider;
};

@Entity()
export class Asset<T extends AssetType = any> extends BaseEntity implements IAsset {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() created_at: number;
  @Column('enum', { enum: AssetType }) type: T;
  @Column('jsonb') meta: AssetMetaUnion[T];
  @Column({ nullable: true }) location: string;
  @Column() asset_identifier: string;

  @OneToOne(() => SigningKey, { nullable: true }) @JoinColumn() signing_key?: SigningKey;
  @ManyToOne(() => AssetGroup, group => group.assets) group: AssetGroup;

  constructor(assetType: T) {
    super();
    this.created_at = timestamp();
    this.type = assetType;
  }

  /**
   * @description Creates the MUX/S3 asset for the object
   * @param mux
   * @param txc
   */
  async setup(provider: AssetProvider[T], txc: EntityManager): Promise<this> {
    switch (this.type) {
      case AssetType.LiveStream:
        {
          // https://docs.mux.com/reference#create-a-live-stream
          const stream: LiveStream = await (provider as AssetProvider[AssetType.LiveStream]).connection.Video.LiveStreams.create(
            {
              reconnect_window: 0, // Time to wait for reconnect on signal loss
              playback_policy: 'signed', // Requires token
              new_asset_settings: {},
              passthrough: '', // Arbitrary passthru data inc. in LS object
              reduced_latency: true, // https://mux.com/blog/reduced-latency-for-mux-live-streaming-now-available/
              simulcast_targets: [], // For 3rd party re-streaming
              test: true // No cost during testing/dev
            }
          );

          this.asset_identifier = stream.id;
          this.meta = to<ILiveStreamMeta>({
            stream_key: stream.stream_key,
            playback_id: stream.playback_ids.find(p => p.policy == 'signed').id,
            state: LiveStreamState.Created
          }) as any;

          // Create a signing key associated with this stream
          // so we can sign JWTs for PerformancePurchases on this Perf only
          const signingKey = await new SigningKey().setup(provider as AssetProvider[AssetType.LiveStream], txc);
          this.signing_key = signingKey;
        }
        break;
      // TODO: add cases for all asset types
      default:
        throw new Error(`${this.type} asset type not implemented`);
    }

    this.location = this.getLocation();
    return txc.save(this);
  }

  // FIXME: use dependency injection for s3 url since this is a shared entity
  private getLocation(S3_URL?: string): string {
    const endpointMappers: { [index in AssetType]?: string } = {
      [AssetType.LiveStream]: `https://stream.mux.com/${(this.meta as IMuxAsset).playback_id}.m3u8`,
      [AssetType.Image]: `http://${S3_URL}.com/${this.asset_identifier}`,
      [AssetType.Thumbnail]: this.createThumbnailUrl((this.meta as unknown) as IThumbnailMeta),
      [AssetType.AnimatedGIF]: this.createGIFUrl((this.meta as unknown) as IGIFMeta)
    };

    return endpointMappers[this.type];
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

    return `https://mux.com/${assetMeta.playback_id}${stitchParameters(parameters)}`;
  };

  createGIFUrl = (assetMeta: IGIFMeta): string => {
    const parameters: Except<IGIFMeta, 'playback_id'> = {
      width: assetMeta.width ?? 300,
      height: assetMeta.height ?? 300,
      start: assetMeta.start ?? 0,
      end: assetMeta.end ?? 0,
      fps: assetMeta.fps ?? 15
    };

    return `https://mux.com/${assetMeta.playback_id}/${stitchParameters(parameters)}`;
  };

  /**
   * @description Deletes the S3/Mux Asset associated with this entity, and itself from Postgres
   */
  async delete(provider: AssetProvider[T]) {
    switch (this.type) {
      // TODO: add cases for storyboards/gifs etc
      case AssetType.LiveStream: {
        await (provider as MuxProvider).connection.Video.LiveStreams.del(this.asset_identifier);
        break;
      }
      case AssetType.Video: {
        await (provider as MuxProvider).connection.Video.Assets.del(this.asset_identifier);
        break;
      }
      case AssetType.Image: {
        await (provider as S3Provider).delete(this.asset_identifier);
      }
    }

    await this.remove();
  }
}
