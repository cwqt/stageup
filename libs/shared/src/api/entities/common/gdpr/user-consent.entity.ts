import { Host, User } from '@core/api';
import { uuid } from '@core/helpers';
import {
  IUserConsent,
  IUserCookiesConsent,
  IUserHostMarketingConsent,
  IUserPerformanceUploadConsent,
  IUserStageUpMarketingConsent,
  NUUID,
  UserConsentType
} from '@core/interfaces';
import {
  BaseEntity,
  ChildEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  RelationId,
  TableInheritance
} from 'typeorm';
import { Consentable } from './consentable.entity';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class UserConsent<T extends UserConsentType> extends BaseEntity implements IUserConsent<T> {
  @PrimaryColumn('varchar') _id: NUUID;

  @Column() type: T;

  constructor() {
    super();
    this._id = uuid();
  }

  toConsent(): Required<IUserConsent<T>> {
    return {
      _id: this._id,
      type: this.type
    };
  }
}
