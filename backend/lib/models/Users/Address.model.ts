import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  IAddress,
} from '@eventi/interfaces';
import { ContactInfo } from './ContactInfo.model';

@Entity()
export class Address extends BaseEntity implements IAddress {
  @PrimaryGeneratedColumn() _id: number;
  @Column()                 city: string;
  @Column()                 iso_country_code: string;
  @Column()                 postcode: string;
  @Column()                 street_name: string;
  @Column()                 street_number: string;
  @Column({nullable:true})  state?: string;
  @Column({nullable:true})  zip_code?: string;

  @ManyToOne(() => ContactInfo, ci => ci.addresses) contact_info:ContactInfo;

  constructor(data:Required<IAddress>) {
    super();
    this.city = data.city;
    this.iso_country_code = data.iso_country_code;
    this.postcode = data.postcode;
    this.street_name = data.street_name;
    this.street_number = data.street_number;
    this.state = data.state;
    this.zip_code = data.zip_code;
  }
}
