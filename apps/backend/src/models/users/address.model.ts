import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IAddress } from '@core/interfaces';
import { ContactInfo } from './contact-info.model';

@Entity()
export class Address extends BaseEntity implements IAddress {
  @PrimaryGeneratedColumn() _id: number;
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

  toFull(): IAddress {
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
