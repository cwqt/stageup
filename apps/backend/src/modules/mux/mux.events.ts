import {
  Asset,
  AssetGroup,
  getCheck,
  Logger,
  LOGGING_PROVIDER,
  ModuleEvents,
  MuxProvider,
  MUX_PROVIDER,
  Performance,
  VideoAsset,
  Contract
} from '@core/api';
import { timeout } from '@core/helpers';
import {
  AssetOwnerType,
  AssetType,
  IMUXHookResponse,
  IMuxPassthrough,
  LiveStreamState,
  PerformanceStatus
} from '@core/interfaces';
import Mux, { LiveStream } from '@mux/mux-node';
import { Inject, Service } from 'typedi';
import { HandledMuxEvents } from './mux.controller';
import { MuxService } from './mux.service';

@Service()
export class MuxEvents extends ModuleEvents<`mux.${HandledMuxEvents}`, true> {
  constructor(
    private muxService: MuxService,
    @Inject(LOGGING_PROVIDER) private log: Logger,
    @Inject(MUX_PROVIDER) private mux: Mux
  ) {
    super();
    this.events = {
      'mux.video.asset.created': this.videoAssetCreated,
      'mux.video.asset.deleted': this.videoAssetDeleted,
      'mux.video.asset.errored': this.videoAssetErrored,
      'mux.video.asset.ready': this.videoAssetReady,
      'mux.video.asset.live_stream_completed': this.streamCompleted,
      'mux.video.live_stream.active': this.streamActive,
      'mux.video.live_stream.created': this.streamCreated,
      'mux.video.live_stream.disconnected': this.streamDisconnected,
      'mux.video.live_stream.idle': this.streamIdle
    };
  }

  // IMUXHookResponse<MuxAsset>
  async videoAssetCreated(ct: Contract<'mux.video.asset.created'>) {
    // Set the asset identifier to the Asset & not the Direct Upload, now that we have it
    const passthrough: IMuxPassthrough = JSON.parse(ct.data.passthrough);
    const asset = await getCheck(Asset.findOne({ _id: passthrough.asset_id }));
    asset.asset_identifier = ct.data.id;
    await asset.save();
  }

  async videoAssetReady(ct: Contract<'mux.video.asset.ready'>) {
    const passthrough: IMuxPassthrough = JSON.parse(ct.data.passthrough);
    const asset = await getCheck(VideoAsset.findOne({ _id: passthrough.asset_id }));

    // Now we have a playback Id & can set the source location on the asset
    const assetInfo = await this.mux.Video.Assets.get(asset.asset_identifier);

    asset.meta.playback_id = assetInfo.playback_ids.find(
      p => p.policy == (asset.signing_key__id ? 'signed' : 'public')
    ).id;

    asset.location = asset.getLocation();
    await asset.save();

    // delete the last trailer video associated with this group, only one trailer / performances
    const group = await AssetGroup.findOne({ _id: passthrough.asset_group_id });
    await Promise.all(
      group.assets
        .filter(a => a.type == AssetType.Video && a._id !== passthrough.asset_id)
        .filter(a => a.tags.includes('trailer'))
        .map((a: VideoAsset) => a.delete(this.mux)) // deletes both Asset & Mux Asset
    );
  }

  async videoAssetErrored(ct: Contract<'mux.video.asset.errored'>) {
    const passthrough: IMuxPassthrough = JSON.parse(ct.data.passthrough);
    const asset = await getCheck(
      Asset.findOne<Asset<AssetType.Video>>({ _id: passthrough.asset_id })
    );

    await asset.remove();
  }

  async videoAssetDeleted(ct: Contract<'mux.video.asset.deleted'>) {}

  async streamCreated(ct: Contract<'mux.video.live_stream.created'>) {
    // FIXME: race condition occurs where the live stream is created in the Performance.setup()
    // but the performance isn't actually saved in the database at this point because
    // the transaction hasn't completed, so put a timeout of 500ms
    // we'll need to revisit this at some point...
    await timeout(500);
    await this.muxService.setLiveStreamAssetState(JSON.parse(ct.data.passthrough), LiveStreamState.Idle);
  }

  async streamIdle(data: IMUXHookResponse<LiveStream>) {
    await this.muxService.setLiveStreamAssetState(JSON.parse(data.data.passthrough), LiveStreamState.Idle);
  }

  async streamActive(data: IMUXHookResponse<LiveStream>) {
    const passthrough: IMuxPassthrough = JSON.parse(data.data.passthrough);
    if (passthrough.asset_owner_type == AssetOwnerType.Performance) {
      const performance = await Performance.findOne({ _id: passthrough.asset_owner_id });
      performance.status = PerformanceStatus.Live;
      await performance.save();
    }

    await this.muxService.setLiveStreamAssetState(passthrough.asset_id, LiveStreamState.Active);
  }

  async streamDisconnected(data: IMUXHookResponse<LiveStream>) {
    const passthrough: IMuxPassthrough = JSON.parse(data.data.passthrough);
    if (passthrough.asset_owner_type == AssetOwnerType.Performance) {
      const performance = await Performance.findOne({ _id: passthrough.asset_owner_id });
      performance.status = PerformanceStatus.Complete;
      await performance.save();
    }

    await this.muxService.setLiveStreamAssetState(JSON.parse(data.data.passthrough), LiveStreamState.Disconnected);
  }

  async streamCompleted(data: IMUXHookResponse<LiveStream>) {
    await this.muxService.setLiveStreamAssetState(JSON.parse(data.data.passthrough), LiveStreamState.Completed);
  }
}
