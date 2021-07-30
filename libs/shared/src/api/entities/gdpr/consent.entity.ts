import { uuid } from '@core/helpers';
import { ConsentType, ConsentTypes, IUserConsent, NUUID } from '@core/interfaces';
import { BaseEntity, Column, Entity, PrimaryColumn, TableInheritance } from 'typeorm';

@Entity() // use __type discriminant otherwise conflicts with type column
@TableInheritance({ column: { type: 'varchar', name: '__type' } })
export abstract class Consent<T extends ConsentType> extends BaseEntity implements IUserConsent<T> {
  @PrimaryColumn('varchar') _id: NUUID;

  @Column('enum', { enum: ConsentTypes }) type: T;

  constructor(type: T) {
    super();
    this._id = uuid();
    this.type = type;
  }

  toConsent(): Required<IUserConsent<T>> {
    return {
      _id: this._id,
      type: this.type
    };
  }
}
