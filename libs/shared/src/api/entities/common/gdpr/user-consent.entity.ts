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

  @RelationId((userConsent: UserConsent<any>) => userConsent.user) user__id: NUUID;
  @ManyToOne(() => User) user: User;

  constructor() {
    super();
    this._id = uuid();
  }

  toConsent(): Required<IUserConsent<T>> {
    return {
      _id: this._id,
      user: this.user.toStub(),
      type: this.type
    };
  }
}
