import { uuid } from '@core/helpers';
import { NUUID } from '@core/interfaces';
import { BaseEntity, Column, DeleteDateColumn, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Asset } from './asset.entity';

@Entity()
export class AssetGroup extends BaseEntity {
  @PrimaryColumn() _id: string;

  @Column('varchar') owner__id: NUUID; // double underscore to match everything else
  @OneToMany(() => Asset, asset => asset.group, { eager: true, onDelete: 'CASCADE', cascade: true }) assets: Asset[];

  //Added soft delete column as performances will always be soft deleted for analytics/ undeletion reasons, associated
  //asset references will therefore be soft deleted too
  @DeleteDateColumn() deletedAt?: Date;

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
