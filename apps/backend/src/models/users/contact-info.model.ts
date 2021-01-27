import { BaseEntity, Column, Entity, EntityManager, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IContactInfo } from '@eventi/interfaces';
import { Address } from './address.model';

@Entity()
export class ContactInfo extends BaseEntity implements IContactInfo {
  @PrimaryGeneratedColumn() _id: number;
  @Column({ nullable: true }) mobile_number: number;
  @Column({ nullable: true }) landline_number: number;

  @OneToMany(() => Address, address => address.contact_info, { cascade: ['remove'], eager: true })
  addresses: Address[];

  constructor(data: Required<IContactInfo>) {
    super();
  }

  async addAddress(address: Address, txc: EntityManager) {
    this.addresses.push(address);
    await txc.save(address);
    await txc.save(this);
  }

  toFull(): IContactInfo {
    return {
      mobile_number: this.mobile_number,
      landline_number: this.landline_number,
      addresses: this.addresses.map(a => a.toFull())
    };
  }
}
