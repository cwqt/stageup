import { BaseEntity, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IContactInfo, IPersonInfo, PersonTitle } from '@eventi/interfaces';
import { Address } from './Address.model';

@Entity()
export class ContactInfo extends BaseEntity implements IContactInfo {
  @PrimaryGeneratedColumn()   _id: number;
  @Column({ nullable: true }) mobile_number: number;
  @Column({ nullable: true }) landline_number: number;

  @OneToMany(
    () => Address,
    (address) => address.contact_info,
    { cascade: ['remove'], eager: true }) addresses: Address[];

  constructor(data: Required<IContactInfo>) {
    super();
  }
}
