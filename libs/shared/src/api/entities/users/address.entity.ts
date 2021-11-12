import { BaseEntity, BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { CountryCode, IAddress } from '@core/interfaces';
import { ContactInfo } from './contact-info.entity';
import { uuid } from '@core/helpers';

@Entity()
export class Address extends BaseEntity implements IAddress {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() city: string;
  @Column('enum', { enum: CountryCode }) country: CountryCode; // iso-3166-alpha3
  @Column() line1: string;
  @Column() line2?: string;
  @Column() postal_code: string;
  @Column({ nullable: true }) state?: string;

  @ManyToOne(() => ContactInfo, ci => ci.addresses) contact_info: ContactInfo;

  constructor(data: Required<IAddress>) {
    super();
    this.city = data.city;
    this.country = data.country;
    this.postal_code = data.postal_code;
    this.line1 = data.line1;
    this.line2 = data.line2;
    this.state = data.state;
  }

  toFull(): Required<IAddress> {
    return {
      _id: this._id,
      city: this.city,
      country: this.country,
      line1: this.line1,
      line2: this.line2,
      postal_code: this.postal_code,
      state: this.state
    };
  }
}
