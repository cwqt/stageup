import { LiveStream } from '@mux/mux-node';
import { IPerformanceHostInfo } from '@eventi/interfaces';
import {
  BaseEntity,
  Column,
  Entity,
  EntityManager,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { SigningKey } from './signing-key.model';
import { DataClient } from '../../common/data';
import config, { Environment } from '../../config';
import { Performance } from './performance.model';
import { timestamp } from '../../common/helpers';

@Entity()
export class PerformanceHostInfo extends BaseEntity implements IPerformanceHostInfo {
  @PrimaryGeneratedColumn() _id: number;
  @Column({ nullable: true }) stream_key: string;
  @Column() created_at: number;

  @OneToOne(() => SigningKey, { eager: true }) @JoinColumn() signing_key: SigningKey;
  @OneToOne(() => Performance, perf => perf.host_info) @JoinColumn() performance: Performance;

  constructor() {
    super();
    this.created_at = timestamp(new Date());
  }

  async setup(dc: DataClient, transEntityManager: EntityManager): Promise<[PerformanceHostInfo, LiveStream]> {
    // https://docs.mux.com/reference#create-a-live-stream
    const stream: LiveStream = await dc.mux.Video.LiveStreams.create({
      reconnect_window: 300, // Time to wait for reconnect on signal loss
      playback_policy: 'signed', // Requires token
      new_asset_settings: {},
      passthrough: '', // Arbitrary passthru data inc. in LS object
      reduced_latency: false,
      simulcast_targets: [], // For 3rd party re-streaming
      test: !config.isEnv(Environment.Production) // No cost during testing/dev
    });

    this.stream_key = stream.stream_key;

    // Create a signing key associated with this stream
    // so we can sign JWTs for PerformancePurchases on this Perf only
    const signingKey = await new SigningKey().setup(dc, transEntityManager);
    this.signing_key = signingKey;

    await transEntityManager.save(this);
    return [this, stream];
  }
}
