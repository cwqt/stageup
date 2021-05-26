import { timestamp, uuid } from '@core/helpers';
import {
  AssetMetaUnion,
  AssetTag,
  AssetTags,
  AssetType,
  IAsset,
  IAssetStub,
  IMuxPassthrough,
  IMuxPassthroughOwnerInfo,
  NUUID
} from '@core/interfaces';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  RelationId,
  TableInheritance
} from 'typeorm';
import { SigningKey } from '../performances/signing-key.entity';
import { AssetGroup } from './asset-group.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Asset<T extends AssetType = any> extends BaseEntity implements IAsset {
  @PrimaryColumn() _id: string;

  @Column() created_at: number;
  @Column({ nullable: true }) location: string;
  @Column() asset_identifier: string;
  @Column('enum', { enum: AssetType }) type: T;
  @Column('jsonb') meta: AssetMetaUnion[T];
  @Column('enum', { array: true, enum: AssetTags, default: [] }) tags: AssetTag[];

  @RelationId((asset: Asset) => asset.signing_key) signing_key__id?: string;
  @OneToOne(() => SigningKey, { nullable: true }) @JoinColumn() signing_key?: SigningKey;

  @RelationId((asset: Asset) => asset.group) group__id: NUUID;
  @ManyToOne(() => AssetGroup, group => group.assets) group: AssetGroup;

  constructor(type: T, group: AssetGroup, tags?: AssetTag[]) {
    super();
    this._id = uuid(); // Set the UUID now so that the passthrough _id matches with this Asset
    this.created_at = timestamp();
    this.type = type;
    this.group = group;
    this.tags = tags || [];
  }

  createPassthroughData(owner: IMuxPassthroughOwnerInfo): IMuxPassthrough {
    return {
      asset_id: this._id,
      asset_group_id: this.group._id,
      asset_owner_type: owner.asset_owner_type,
      asset_owner_id: owner.asset_owner_id
    };
  }

  toStub(): Required<IAssetStub<T>> {
    return {
      _id: this._id,
      type: this.type,
      location: this.location,
      tags: this.tags
    };
  }
}
