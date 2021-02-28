import { BaseEntity, Entity, Column, BeforeInsert, PrimaryColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { IAccessToken, TokenProvisioner, DtoAccessToken } from '@core/interfaces';
import { User } from '../users/user.entity';
import { Performance } from './performance.entity';
import { timestamp, uuid } from '@core/shared/helpers';
import { PerformancePurchase } from './purchase.entity';
import { SigningKey } from './signing-key.entity';

@Entity()
export class AccessToken extends BaseEntity implements IAccessToken {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() { this._id = uuid() }

  @Column() access_token: string;
  @Column() created_at: number;
  @Column({ nullable: true }) expires_at: number;
  @Column('enum', { enum: TokenProvisioner }) provisioner_type: TokenProvisioner;
  @Column() provisioner_id: string;

  @ManyToOne(() => User) @JoinColumn() user: User;
  @ManyToOne(() => Performance) @JoinColumn() performance: Performance;

  constructor(user: User, performance: Performance, provisioner: User | PerformancePurchase, type: TokenProvisioner) {
    super();

    this.user = user;
    this.performance = performance;
    this.created_at = timestamp();

    // Wanted to do a polymorphic relationship but it isn't supported....so yeah
    this.provisioner_id = provisioner._id;
    this.provisioner_type = type;
  }

  sign(key:SigningKey) {
    this.access_token = key.signToken(this.performance);
    return this;
  }

  getProvisionerEntity() {
    if(this.provisioner_type == TokenProvisioner.Purchase) return PerformancePurchase;
    return User;
  }

  toFull():Required<DtoAccessToken> {
    return {
      _id: this._id,
      access_token: this.access_token, // the token itself to watch said video
      created_at: this.created_at,
      expires_at: this.expires_at,
      provisioner_type: this.provisioner_type,
      provisioner_id: this.provisioner_id,
      performance: this.performance._id,
      user: this.user._id,
    }
  }
}
