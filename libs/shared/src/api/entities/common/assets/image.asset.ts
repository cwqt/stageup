import { Asset } from '../asset.entity';
import { SigningKey } from '../../performances/signing-key.entity';
import { AssetGroup } from '../asset-group.entity';
import { AssetType, IMuxPassthroughOwnerInfo, LiveStreamState } from '@core/interfaces';
import { ChildEntity, EntityManager } from 'typeorm';
import { AssetMethods, AssetOptions, AssetProvider } from '.';
import { LiveStream, Upload } from '@mux/mux-node';

@ChildEntity(AssetType.Image)
export class ImageAsset extends Asset<AssetType.Image> implements AssetMethods<AssetType.Image> {
  constructor(group: AssetGroup) {
    super(AssetType.Image, group);
  }

  async setup(
    provider: AssetProvider[AssetType.Image],
    options: AssetOptions[AssetType.Image],
    owner: IMuxPassthroughOwnerInfo,
    txc: EntityManager
  ) {
    this.location = this.getLocation(options);
    return null;
  }

  getLocation(options: AssetOptions[AssetType.Image]) {
    return `http://${options.s3_url}.com/${this.asset_identifier}`;
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
