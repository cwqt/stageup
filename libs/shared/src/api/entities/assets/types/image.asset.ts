import { Asset } from '../asset.entity';
import { AssetGroup } from '../asset-group.entity';
import { AssetTag, AssetType, IMuxPassthroughOwnerInfo, LiveStreamState } from '@core/interfaces';
import { ChildEntity, EntityManager } from 'typeorm';
import { AssetMethods, AssetOptions, AssetProvider } from '.';
import { LiveStream, Upload } from '@mux/mux-node';

@ChildEntity(AssetType.Image)
export class ImageAsset extends Asset<AssetType.Image> implements AssetMethods<AssetType.Image> {
  constructor(group: AssetGroup, tags: AssetTag[]) {
    super(AssetType.Image, group, tags);
    this.meta = {};
  }

  async setup(
    provider: AssetProvider[AssetType.Image],
    options: AssetOptions[AssetType.Image],
    owner: IMuxPassthroughOwnerInfo,
    txc: EntityManager
  ) {
    const res = await provider.upload(options.file);
    this.asset_identifier = res.asset_identifier;
    this.location = res.location;
    return res;
  }

  getLocation() {
    return this.location;
  }

  async delete(provider: AssetProvider[AssetType.Image]) {
    await super.remove();
  }

  toDto() {
    return {
      ...super.toStub(),
      is_signed: false
    };
  }
}
