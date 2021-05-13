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
  IVideoMeta,
  LiveStreamState,
  IMuxPassthroughOwnerInfo,
  IAssetStub,
  IMuxPassthrough
} from '@core/interfaces';
import { stitchParameters, timestamp, to, uuid } from '@core/helpers';
import { Except } from 'type-fest';
import { CreateUploadParams, LiveStream, Upload } from '@mux/mux-node';
import { SigningKey } from '../performances/signing-key.entity';
import { AssetGroup } from './asset-group.entity';
import MuxProvider from '../../data-client/providers/mux.provider';
import BlobProvider from '../../data-client/providers/blob.provider';
import merge from 'deepmerge';

type AssetProvider = {
  [AssetType.Image]: BlobProvider;
  [AssetType.AnimatedGIF]: MuxProvider;
  [AssetType.LiveStream]: MuxProvider;
  [AssetType.Thumbnail]: MuxProvider;
  [AssetType.Video]: MuxProvider;
  [AssetType.Storyboard]: MuxProvider;
};

type AssetOptions = {
  [AssetType.Image]: {
    s3_url: string;
  };
  [AssetType.Video]: CreateUploadParams;
  [AssetType.AnimatedGIF]: void;
  [AssetType.LiveStream]: void;
  [AssetType.Thumbnail]: void;
  [AssetType.Storyboard]: void;
};

type AssetObject = {
  [AssetType.Video]: Upload;
  [AssetType.LiveStream]: LiveStream;
  [AssetType.Image]: null;
  [AssetType.AnimatedGIF]: null;
  [AssetType.Thumbnail]: null;
  [AssetType.Storyboard]: null;
};

@Entity()
export class Asset<T extends AssetType = any> extends BaseEntity implements IAsset {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = this._id || uuid();
  }

  @Column() created_at: number;
  @Column('enum', { enum: AssetType }) type: T;
  @Column('jsonb') meta: AssetMetaUnion[T];
  @Column({ nullable: true }) location: string;
  @Column() asset_identifier: string;

  @OneToOne(() => SigningKey, { nullable: true }) @JoinColumn() signing_key?: SigningKey;
  @ManyToOne(() => AssetGroup, group => group.assets) group: AssetGroup;

  constructor(assetType: T, assetGroup: AssetGroup) {
    super();
    this._id = uuid(); // Set the UUID now so that the passthrough _id matches with this Asset
    this.created_at = timestamp();
    this.type = assetType;
    this.group = assetGroup;
  }

  /**
   * @description Creates the MUX/S3 asset for the object
   * @param mux
   * @param txc
   */
  async setup(
    provider: AssetProvider[T],
    txc: EntityManager,
    options: AssetOptions[T],
    owner: IMuxPassthroughOwnerInfo
  ): Promise<AssetObject[T]> {
    const passthrough: IMuxPassthrough = {
      asset_id: this._id,
      asset_group_id: this.group._id,
      asset_owner_type: owner.asset_owner_type,
      asset_owner_id: owner.asset_owner_id
    };

    let object: AssetObject[T] = await (async () => {
      switch (this.type) {
        // Live Streams ----------------------------------------------------------------------------
        case AssetType.LiveStream: {
          // https://docs.mux.com/reference#create-a-live-stream
          const stream: LiveStream = await (provider as AssetProvider[AssetType.LiveStream]).connection.Video.LiveStreams.create(
            {
              reconnect_window: 0, // Time to wait for reconnect on signal loss
              playback_policy: 'signed', // Requires token
              new_asset_settings: {},
              passthrough: JSON.stringify(passthrough), // Passed through in webhook handlers
              reduced_latency: true, // https://mux.com/blog/reduced-latency-for-mux-live-streaming-now-available/
              simulcast_targets: [], // For 3rd party re-streaming
              test: true // No cost during testing/dev
            }
          );

          this.asset_identifier = stream.id;
          this.meta = to<AssetMetaUnion[AssetType.LiveStream]>({
            stream_key: stream.stream_key,
            playback_id: stream.playback_ids.find(p => p.policy == 'signed').id,
            state: LiveStreamState.Created
          }) as AssetMetaUnion[T];

          // Create a signing key associated with this stream
          // so we can sign JWTs for PerformancePurchases on this Perf only
          const signingKey = await new SigningKey().setup(provider as AssetProvider[AssetType.LiveStream], txc);

          this.signing_key = signingKey;
          return stream as AssetObject[T];
        }
        // Video Assets ----------------------------------------------------------------------------
        case AssetType.Video: {
          // deepmerge to avoid new_asset_settings over-write
          const video: Upload = await (provider as AssetProvider[AssetType.Video]).connection.Video.Uploads.create(
            merge(options as any, { new_asset_settings: { passthrough: JSON.stringify(passthrough) } })
          );

          // No playback ID until the webhook "video.asset.ready" comes through,
          // must not be NULL though for saving to DB
          this.meta = to<AssetMetaUnion[AssetType.Video]>({
            playback_id: ''
          }) as AssetMetaUnion[T];

          this.asset_identifier = video.id; // Direct Upload id, not the Asset...
          return video as AssetObject[T];
        }
        // TODO: add cases for all asset types
        // Static Images ----------------------------------------------------------------------------
        // Storyboards ------------------------------------------------------------------------------
        // Animated GIFs ----------------------------------------------------------------------------
        // Thumbnials -------------------------------------------------------------------------------
        default:
          throw new Error(`Asset type '${this.type}' not implemented`);
      }
    })();

    this.location = this.getLocation(options);
    await txc.save(this);

    return object;
  }

  // FIXME: use dependency injection for s3 url since this is a shared entity
  getLocation(options?: AssetOptions[T]): string {
    // these need to be functions that return strings, otherwise they'll immediately evaluate
    // and error because of the different meta objects having different keys
    const endpointMappers: { [index in AssetType]: () => string } = {
      [AssetType.Storyboard]: () => ``,
      [AssetType.Video]: () => `https://stream.mux.com/${(this.meta as IVideoMeta).playback_id}.m3u8`,
      [AssetType.LiveStream]: () => `https://stream.mux.com/${(this.meta as IMuxAsset).playback_id}.m3u8`,
      [AssetType.Image]: () =>
        `http://${(options as AssetOptions[AssetType.Image]).s3_url}.com/${this.asset_identifier}`,
      [AssetType.Thumbnail]: () => this.createThumbnailUrl((this.meta as unknown) as IThumbnailMeta),
      [AssetType.AnimatedGIF]: () => this.createGIFUrl((this.meta as unknown) as IGIFMeta)
    };

    return endpointMappers[this.type]();
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
        await (provider as BlobProvider).delete(this.asset_identifier);
      }
    }

    await this.remove();
  }

  toStub(): Required<IAssetStub<T>> {
    return {
      _id: this._id,
      type: this.type,
      location: this.location
    };
  }
}
