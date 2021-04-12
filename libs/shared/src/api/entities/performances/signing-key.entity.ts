import { JwtAccessToken, IMuxAsset, IPerformance, ISigningKey } from '@core/interfaces';
import { BaseEntity, BeforeInsert, Column, Entity, EntityManager, PrimaryColumn } from 'typeorm';

import Mux, { JWT } from '@mux/mux-node';

import { Performance } from './performance.entity';
import { timestamp, uuid } from '@core/shared/helpers';
import { Asset } from '../common/asset.entity';
import MuxProvider from '../../data-client/providers/mux.provider';

@Entity()
export class SigningKey extends BaseEntity implements ISigningKey {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() rsa256_key: string;
  @Column() mux_key_id: string;
  @Column() created_at: number;

  constructor() {
    super();
    this.created_at = timestamp();
  }

  async setup(mux:MuxProvider, txc: EntityManager): Promise<SigningKey> {
    // https://docs.mux.com/reference#url-signing-keys
    const { id, private_key } = await mux.connection.Video.SigningKeys.create();

    this.mux_key_id = id;
    this.rsa256_key = private_key;

    return txc.save(this);
  }

  signToken(asset:Asset<any>): JwtAccessToken {
    return JWT.sign((asset.meta as IMuxAsset).playback_id, {
      type: 'video',
      keyId: this.mux_key_id,
      keySecret: this.rsa256_key
    });
  }
}
