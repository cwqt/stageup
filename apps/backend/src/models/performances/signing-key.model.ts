import { IPerformance, ISigningKey } from '@core/interfaces';
import { BaseEntity, BeforeInsert, Column, Entity, EntityManager, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

import { LiveStream, Video, JWT } from '@mux/mux-node';
import { DataClient } from '../../common/data';

import { Performance } from './performance.model';
import { timestamp, uuid } from '../../common/helpers';

@Entity()
export class SigningKey extends BaseEntity implements ISigningKey {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() rsa256_key: string;
  @Column() mux_key_id: string;
  @Column() created_at: number;

  constructor() {
    super();
    this.created_at = timestamp(new Date());
  }

  async setup(dc: DataClient, txc: EntityManager): Promise<SigningKey> {
    // https://docs.mux.com/reference#url-signing-keys
    const signingKey = await (dc as any).mux.Video.SigningKeys.create();

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
