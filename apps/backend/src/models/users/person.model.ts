import { BaseEntity, BeforeInsert, Column, Entity, EntityManager, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IPersonInfo, PersonTitle } from '@core/interfaces';
import { ContactInfo } from './contact-info.model';
import { uuid } from '@core/shared/helpers';

@Entity()
export class Person extends BaseEntity implements IPersonInfo {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column({ nullable: true }) first_name: string;
  @Column({ nullable: true }) last_name: string;
  @Column('enum', { nullable: true, enum: PersonTitle }) title: PersonTitle;

  @OneToOne(() => ContactInfo, { cascade: ['remove'], eager: true })
  @JoinColumn()
  contact_info: ContactInfo;

  constructor(data: Required<IPersonInfo>) {
    super();
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.title = data.title;
  }

  async addContactInfo(contactInfo: ContactInfo, txc: EntityManager): Promise<Person> {
    this.contact_info = contactInfo;
    await txc.save(ContactInfo, this.contact_info);
    return this;
  }
}
