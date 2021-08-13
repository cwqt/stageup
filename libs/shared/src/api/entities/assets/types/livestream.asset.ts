import { Asset } from '../asset.entity';
import { SigningKey } from '../signing-key.entity';
import { AssetGroup } from '../asset-group.entity';
import { AssetTag, AssetType, IMuxPassthroughOwnerInfo, LiveStreamState } from '@core/interfaces';
import { ChildEntity, EntityManager } from 'typeorm';
import { AssetMethods, AssetOptions, AssetProvider } from '.';
import { LiveStream } from '@mux/mux-node';

@ChildEntity(AssetType.LiveStream)
export class LiveStreamAsset extends Asset<AssetType.LiveStream> implements AssetMethods<AssetType.LiveStream> {
  constructor(group: AssetGroup, tags?: AssetTag[]) {
    super(AssetType.LiveStream, group, tags);
  }

  async setup(
    provider: AssetProvider[AssetType.LiveStream],
    options: AssetOptions[AssetType.LiveStream],
    owner: IMuxPassthroughOwnerInfo,
    txc: EntityManager
  ) {
    // https://docs.mux.com/reference#create-a-live-stream
    const stream: LiveStream = await provider.connection.Video.LiveStreams.create({
      reconnect_window: 0, // Time to wait for reconnect on signal loss
      playback_policy: 'signed', // Requires token
      new_asset_settings: {},
      passthrough: JSON.stringify(super.createPassthroughData(owner)), // Passed through in webhook handlers
      reduced_latency: true, // https://mux.com/blog/reduced-latency-for-mux-live-streaming-now-available/
      simulcast_targets: [], // For 3rd party re-streaming
      test: true // No cost during testing/dev
    });

    this.asset_identifier = stream.id;
    this.meta = {
      stream_key: stream.stream_key,
      playback_id: stream.playback_ids.find(p => p.policy == 'signed').id,
      state: LiveStreamState.Created
    };

    // Have a signed playbackId, so set the asset URL
    this.location = this.getLocation();

    // Create a signing key associated with this stream, so we can sign JWTs for PerformancePurchases on this Perf only
    const signingKey = await new SigningKey().setup(provider, txc);
    this.signing_key = signingKey;
    return stream;
  }

  getLocation() {
    return `https://stream.mux.com/${this.meta.playback_id}.m3u8`;
  }

  async delete(provider: AssetProvider[AssetType.LiveStream]) {
    await provider.connection.Video.LiveStreams.del(this.asset_identifier);
    await super.remove();
  }

  toDto() {
    return {
      ...super.toStub(),
      state: this.meta.state,
      is_signed: this.signing_key__id != null
    };
  }
}
