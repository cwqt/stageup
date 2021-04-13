import { uuid } from '@core/shared/helpers';
import { BaseEntity, BeforeInsert, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Asset } from './asset.entity';

@Entity()
export class AssetGroup extends BaseEntity {
  @PrimaryColumn() _id: string;

  @OneToMany(() => Asset, asset => asset.group, { eager: true }) assets: Asset[];

  constructor() {
    super();
    this._id = uuid(); // have an id before save
    this.assets = [];
  }

  push(asset: Asset) {
    this.assets.push(asset);
  }
}
