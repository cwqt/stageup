import { BaseEntity, Entity, Column, BeforeInsert, PrimaryColumn, EntityManager, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { IAsset, AssetMetaUnion, IGIFMeta, AssetType, IThumbnailMeta, IStaticMeta, IMuxAsset } from '@core/interfaces';
import { stitchParameters, timestamp, uuid } from '@core/shared/helpers';
import { Except } from 'type-fest';
import Mux, { LiveStream } from '@mux/mux-node';
import { SigningKey } from '../performances/signing-key.entity';
import { Asset } from './asset.entity';

@Entity()
export class AssetGroup extends BaseEntity {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @OneToMany(() => Asset, asset => asset.group) assets: Asset[];

  constructor() {
    super();
    this.assets = [];
  }

  push(asset:Asset) {
    this.assets.push(asset);
  }
}
