import Mux, { LiveStream } from '@mux/mux-node';
import { IPerformanceHostInfo, Environment } from '@core/interfaces';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  EntityManager,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { SigningKey } from './signing-key.entity';
import { Performance } from './performance.entity';
import { timestamp, uuid } from '@core/shared/helpers';

@Entity()
export class PerformanceHostInfo extends BaseEntity implements IPerformanceHostInfo {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column({ nullable: true }) stream_key: string;
  @Column() created_at: number;

  @OneToOne(() => SigningKey, { eager: true }) @JoinColumn() signing_key: SigningKey;
  @OneToOne(() => Performance, perf => perf.host_info) @JoinColumn() performance: Performance;

  constructor() {
    super();
    this.created_at = timestamp(new Date());
  }

  async setup(mux:Mux, transEntityManager: EntityManager): Promise<[PerformanceHostInfo, LiveStream]> {
    try {
    // https://docs.mux.com/reference#create-a-live-stream
    const stream: LiveStream = await mux.Video.LiveStreams.create({
      reconnect_window: 300, // Time to wait for reconnect on signal loss
      playback_policy: 'signed', // Requires token
      new_asset_settings: {},
      passthrough: '', // Arbitrary passthru data inc. in LS object
      reduced_latency: false, // https://mux.com/blog/reduced-latency-for-mux-live-streaming-now-available/
      simulcast_targets: [], // For 3rd party re-streaming
      test: true // No cost during testing/dev
    });

    this.stream_key = stream.stream_key;

    // Create a signing key associated with this stream
    // so we can sign JWTs for PerformancePurchases on this Perf only
    const signingKey = await new SigningKey().setup(mux, transEntityManager);
    this.signing_key = signingKey;

    await transEntityManager.save(this);
    return [this, stream];
      
    } catch (error) {
      console.log(error);
    }
  }
}
