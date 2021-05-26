import { SigningKey } from '@core/api';
import { uuid } from '@core/helpers';
import { NUUID } from '@core/interfaces';
import { BaseEntity, Entity, EntityManager, ManyToOne, PrimaryColumn, RelationId } from 'typeorm';
import { transact } from '../../typeorm-patches';
import { Asset } from './asset.entity';

@Entity()
export class Claim extends BaseEntity {
  @PrimaryColumn() _id: string;

  constructor() {
    super();
    this._id = uuid(); // have an id before save
  }

  async assign(assets: Asset[], txc?: EntityManager) {
    return transact(async t => {
      const pivots = assets.map(asset => new ClaimAssetPivot(this, asset));
      return await t.save(pivots);
    }, txc);
  }

  async verify(asset: Asset, txc?: EntityManager): Promise<boolean> {
    return transact(async t => {
      const pivot = await t
        .createQueryBuilder(ClaimAssetPivot, 'pivot')
        .where('pivot.claim__id = :claim_id', { claim_id: this._id })
        .andWhere('pivot.asset__id = :asset_id', { asset_id: asset._id })
        .getOne();

      return pivot != null;
    }, txc);
  }
}

@Entity()
export class ClaimAssetPivot extends BaseEntity {
  @PrimaryColumn('varchar') _id: NUUID;

  // Many-to-Many relation
  @RelationId((pivot: ClaimAssetPivot) => pivot.claim) claim__id: string;
  @ManyToOne(() => Claim) claim: Claim;

  @RelationId((pivot: ClaimAssetPivot) => pivot.asset) asset__id: string;
  @ManyToOne(() => Asset) asset: Asset;

  constructor(claim: Claim, asset: Asset) {
    super();
    this._id = uuid();

    this.claim = claim;
    this.asset = asset;
  }
}
