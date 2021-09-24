import { Consentable } from '@core/api';
import { uuid, timestamp } from '@core/helpers';
import { ConsentType, ConsentTypes, IUserConsent, NUUID } from '@core/interfaces';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  TableInheritance,
  RelationId,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity() // use __type discriminant otherwise conflicts with type column
@TableInheritance({ column: { type: 'varchar', name: '__type' } })
export abstract class Consent<T extends ConsentType> extends BaseEntity implements IUserConsent<T> {
  @PrimaryColumn('varchar') _id: NUUID;

  @Column('enum', { enum: ConsentTypes }) type: T;
  @Column() saved_at: number;

  @RelationId((consent: Consent<T>) => consent.terms_and_conditions) terms_and_conditions__id: NUUID;
  @ManyToOne(() => Consentable) @JoinColumn() terms_and_conditions: Consentable<'general_toc'>;

  constructor(type: T, termsAndConditions: Consentable<'general_toc'>) {
    super();
    this._id = uuid();
    this.type = type;
    this.terms_and_conditions = termsAndConditions;
    this.saved_at = timestamp(new Date());
  }

  toConsent(): Required<IUserConsent<T>> {
    return {
      _id: this._id,
      type: this.type,
      terms_and_conditions: this.terms_and_conditions,
      saved_at: this.saved_at
    };
  }
}
