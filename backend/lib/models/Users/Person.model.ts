import { BaseEntity, Column, Entity, EntityManager, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  IPersonInfo,
  PersonTitle,
} from '@eventi/interfaces';
import { ContactInfo } from './ContactInfo.model';

@Entity()
export class Person extends BaseEntity implements IPersonInfo {
  @PrimaryGeneratedColumn() _id: number;
  @Column({nullable:true})  first_name: string;
  @Column({nullable:true})  last_name: string;
  @Column({nullable:true})  title: PersonTitle;

  @OneToOne(() => ContactInfo, { cascade: ["remove"], eager: true })
  @JoinColumn() contact_info:ContactInfo;

  constructor(data:Omit<Required<IPersonInfo>, "contact_info">) {
    super();
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.title = data.title;
  }

  async addContactInfo(contactInfo:ContactInfo, txc:EntityManager):Promise<Person> {
    this.contact_info = contactInfo;
    await txc.save(ContactInfo, this.contact_info);
    return this;
  }
}
