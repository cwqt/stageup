import { timestamp, uuid } from '@core/helpers';
import { AssetType, IMuxAsset, ISignedToken, ISigningKey } from '@core/interfaces';
import { JWT, JWTOptions } from '@mux/mux-node';
import { BaseEntity, BeforeInsert, Column, Entity, EntityManager, PrimaryColumn } from 'typeorm';
import MuxProvider from '../../data-client/providers/mux.provider';
import { Asset } from './asset.entity';

export type SignableAssetType =
  | AssetType.AnimatedGIF
  | AssetType.LiveStream
  | AssetType.Storyboard
  | AssetType.Video
  | AssetType.Thumbnail;

@Entity()
export class SigningKey extends BaseEntity implements ISigningKey {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() rsa256_key: string;
  @Column() mux_key_id: string;
  @Column() created_at: number;

  constructor() {
    super();
    this.created_at = timestamp();
  }

  async setup(mux: MuxProvider, txc: EntityManager): Promise<SigningKey> {
    // https://docs.mux.com/reference#url-signing-keys
    const { id, private_key } = await mux.connection.Video.SigningKeys.create();

    this.mux_key_id = id;
    this.rsa256_key = private_key;

    return txc.save(this);
  }

  sign(asset: Asset<SignableAssetType>): ISignedToken {
    const jwt = JWT.sign((asset.meta as IMuxAsset).playback_id, {
      type: this.mapAssetTypeToClaimType(asset.type),
      keyId: this.mux_key_id,
      keySecret: this.rsa256_key
    });

    return { asset_id: asset._id, signed_token: jwt };
  }

  private mapAssetTypeToClaimType(type: SignableAssetType): JWTOptions['type'] {
    const map: { [index in SignableAssetType]: JWTOptions['type'] } = {
      [AssetType.LiveStream]: 'video',
      [AssetType.Video]: 'video',
      [AssetType.AnimatedGIF]: 'gif',
      [AssetType.Storyboard]: 'storyboard',
      [AssetType.Thumbnail]: 'thumbnail'
    };

    return map[type];
  }
}
