import { Asset } from '../asset.entity';
import { SigningKey } from '../../performances/signing-key.entity';
import { AssetGroup } from '../asset-group.entity';
import { AssetTag, AssetType, IMuxPassthroughOwnerInfo } from '@core/interfaces';
import { ChildEntity, EntityManager } from 'typeorm';
import { AssetMethods, AssetOptions, AssetProvider } from '.';
import merge from 'deepmerge';
import { Upload } from '@mux/mux-node';

@ChildEntity(AssetType.Video)
export class VideoAsset extends Asset<AssetType.Video> implements AssetMethods<AssetType.Video> {
  constructor(group: AssetGroup, tags: AssetTag[]) {
    super(AssetType.Video, group, tags);
  }

  async setup(
    provider: AssetProvider[AssetType.Video],
    options: AssetOptions[AssetType.Video],
    owner: IMuxPassthroughOwnerInfo,
    txc: EntityManager
  ) {
    // https://docs.mux.com/guides/video/upload-files-directly#1-create-an-authenticated-mux-url
    // deepmerge to avoid new_asset_settings over-write
    const video: Upload = await provider.connection.Video.Uploads.create(
      merge(options, { new_asset_settings: { passthrough: JSON.stringify(super.createPassthroughData(owner)) } })
    );

    this.asset_identifier = video.id; // Direct Upload id, not the Asset...
    this.meta = {
      // No playback ID until the webhook "video.asset.ready" comes through, must not be NULL though for saving to DB,
      // set the location when the hook is receieved
      playback_id: '',
      // Save Upload URL for later
      presigned_upload_url: video.url
    };

    // Create a signing key associated with this VoD, so we can sign JWTs for PerformancePurchases on this Perf only
    if (options.new_asset_settings.playback_policy == 'signed') {
      const signingKey = await new SigningKey().setup(provider as AssetProvider[AssetType.Video], txc);
      this.signing_key = signingKey;
    }

    return video;
  }

  getLocation() {
    return `https://stream.mux.com/${this.meta.playback_id}.m3u8`;
  }

  async delete(provider: AssetProvider[AssetType.Video]) {
    await provider.connection.Video.Assets.del(this.asset_identifier);
    await super.remove();
  }

  toDto() {
    return {
      ...super.toStub(),
      is_signed: this.signing_key__id != null
    };
  }
}
