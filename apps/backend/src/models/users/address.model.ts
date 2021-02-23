import { BaseEntity, BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IAddress } from '@core/interfaces';
import { ContactInfo } from './contact-info.model';
import { uuid } from '@core/shared/helpers';

@Entity()
export class Address extends BaseEntity implements IAddress {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() city: string;
  @Column() iso_country_code: string;
  @Column() postcode: string;
  @Column() street_name: string;
  @Column() street_number: number;

  @ManyToOne(() => ContactInfo, ci => ci.addresses) contact_info: ContactInfo;

  constructor(data: Required<IAddress>) {
    super();
    this.city = data.city;
    this.iso_country_code = data.iso_country_code;
    this.postcode = data.postcode;
    this.street_name = data.street_name;
    this.street_number = data.street_number;
  }

  toFull(): Required<IAddress> {
    return {
      _id: this._id,
      city: this.city,
      iso_country_code: this.iso_country_code,
      postcode: this.postcode,
      street_name: this.street_name,
      street_number: this.street_number
    };
  }
}
