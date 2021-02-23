import { IPerformance, ISigningKey } from '@core/interfaces';
import { BaseEntity, BeforeInsert, Column, Entity, EntityManager, PrimaryColumn } from 'typeorm';

import { JWT } from '@mux/mux-node';

import { Performance } from './performance.model';
import { timestamp, uuid } from '@core/shared/helpers';
import { DataConnections } from '@core/shared/api';
import { BackendDataClient } from '../../common/data';

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

  async setup(dc: DataConnections<BackendDataClient>, txc: EntityManager): Promise<SigningKey> {
    // https://docs.mux.com/reference#url-signing-keys
    const signingKey = await dc.mux.Video.SigningKeys.create();

    // Response isn't actually enveloped - great docs :)
    this.mux_key_id = signingKey.id;
    this.rsa256_key = signingKey.private_key;

    await txc.save(this);
    return this;
  }

  signToken(performance: Performance | IPerformance): string {
    return JWT.sign(performance.playback_id, {
      type: 'video',
      keyId: this.mux_key_id,
      keySecret: this.rsa256_key
      // Expiration: string,
      // params: any
    });
  }
}
