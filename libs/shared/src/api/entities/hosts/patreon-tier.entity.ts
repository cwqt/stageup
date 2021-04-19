import { CurrencyCode, DtoCreatePatreonTier, IHostPatronTier, IPatronTier } from '@core/interfaces';
import { timestamp, uuid } from '@core/shared/helpers';
import { BaseEntity, BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Host } from './host.entity';

@Entity()
export class PatreonTier extends BaseEntity implements IHostPatronTier {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() name: string;
  @Column() created_at: number;
  @Column({ nullable: true }) cover_image: string;
  @Column() version: number;
  @Column() amount: number;
  @Column() total_patrons: number; // de-normalised col that gets adjusted on user buying/removing patronage
  @Column() is_visible: boolean;
  @Column('jsonb', { nullable: true }) description:Array<any>; // quilljs operation array
  @Column('enum', { enum: CurrencyCode }) currency: CurrencyCode;

  @ManyToOne(() => Host, host => host.patreon_tiers) host: Host;

  constructor(data:DtoCreatePatreonTier, host: Host) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.amount = data.amount;
    this.currency = data.currency;
    this.host = host;

    this.is_visible = false;
    this.total_patrons = 0;
    this.version = 0;
    this.created_at = timestamp();
  }

  toFull(): Required<IPatronTier> {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      created_at: this.created_at,
      cover_image: this.cover_image,
      currency: this.currency,
      amount: this.amount
    };
  }

  toHost():Required<IHostPatronTier> {
    return {
      ...this.toFull(),
      total_patrons: this.total_patrons,
      is_visible: this.is_visible,
      version: this.version
    }
  }
}
