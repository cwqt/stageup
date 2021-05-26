import { to, uuid } from '@core/helpers';
import { NUUID, AssetDto, AssetType } from '@core/interfaces';
import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn, RelationId } from 'typeorm';
import { Asset } from './asset.entity';

@Entity()
export class AssetGroup extends BaseEntity {
  @PrimaryColumn() _id: string;

  @Column('varchar') owner__id: NUUID; // double underscore to match everything else
  @OneToMany(() => Asset, asset => asset.group, { eager: true }) assets: Asset[];

  constructor(ownerId: string) {
    super();
    this._id = uuid(); // have an id before save
    this.owner__id = ownerId;
    this.assets = [];
  }

  push(asset: Asset) {
    this.assets.push(asset);
  }
}
