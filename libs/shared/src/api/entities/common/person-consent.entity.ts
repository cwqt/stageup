import {
    BaseEntity,
    Entity,
    Column,
    OneToMany,
    EntityManager,
    OneToOne,
    JoinColumn,
    BeforeInsert,
    PrimaryColumn,
    RelationId,
    ManyToOne
  } from 'typeorm';

import { Host, User, Performance, Consent } from '@core/api';
import { uuid } from '@core/helpers';
  
  import {
    IPersonConsent,
    NUUID
  } from '@core/interfaces';
  

  
  @Entity()
  export class PersonConsent extends BaseEntity implements IPersonConsent {
    @PrimaryColumn() _id: NUUID;
  
    @Column() type: string;
    @Column() consent_given: boolean;
    @Column({ nullable: true }) ip_address: NUUID;
    @Column({ nullable: true }) privacy_policy__id: NUUID;
    @Column({ nullable: true }) cookies__id: NUUID;
    @Column({ nullable: true }) uploaders_terms_and_conditions__id: NUUID;


    // Many-to-Many relation
    @RelationId((personConsent: PersonConsent) => personConsent.user) user__id: NUUID;
    @ManyToOne(() => User, { nullable: true }) user: User;

    @RelationId((personConsent: PersonConsent) => personConsent.host) host__id: NUUID;
    @ManyToOne(() => Host, { nullable: true }) host: Host;

    @RelationId((personConsent: PersonConsent) => personConsent.performance) performance__id: NUUID;
    @ManyToOne(() => Performance, { nullable: true }) performance: Performance;

    @RelationId((personConsent: PersonConsent) => personConsent.terms_and_conditions) terms_and_conditions__id: NUUID;
    @ManyToOne(() => Consent, consent => consent.type =='general_toc' { nullable: true }) performance: Consent;
  
    constructor(data: IPersonConsent) {
      super();
      this._id = uuid();
      this.type = data.type;
      this.consent_given = data.consent_given;
      this.consent_given = data.consent_given;
      this.consent_given = data.consent_given;
      this.consent_given = data.consent_given;
      this.consent_given = data.consent_given;
      this.consent_given = data.consent_given;
      this.consent_given = data.consent_given;
      this.consent_given = data.consent_given;
    }
  
  }
  