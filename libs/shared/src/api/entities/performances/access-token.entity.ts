import { BaseEntity, Entity, Column, BeforeInsert, PrimaryColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { IAccessToken, TokenProvisioner, DtoAccessToken, JwtAccessToken } from '@core/interfaces';
import { User } from '../users/user.entity';
import { Performance } from './performance.entity';
import { timestamp, uuid } from '@core/shared/helpers';
import { SigningKey } from './signing-key.entity';
import { Invoice } from '../common/invoice.entity';

@Entity()
export class AccessToken extends BaseEntity implements IAccessToken {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column("varchar") access_token: JwtAccessToken;
  @Column() created_at: number;
  @Column({ nullable: true }) expires_at: number;
  @Column('enum', { enum: TokenProvisioner }) provisioner_type: TokenProvisioner;
  @Column() provisioner_id: string;

  @ManyToOne(() => User) @JoinColumn() user: User;
  @ManyToOne(() => Performance) @JoinColumn() performance: Performance;
  @ManyToOne(() => Invoice) @JoinColumn() invoice: Invoice;

  constructor(user: User, performance: Performance, provisioner: User | Invoice, type: TokenProvisioner) {
    super();

    this.user = user;
    this.performance = performance;
    this.created_at = timestamp();

    // Wanted to do a polymorphic relationship but it isn't supported....so yeah
    // supertype model
    this.provisioner_id = provisioner._id;
    this.provisioner_type = type;
  }

  sign(key: SigningKey) {
    this.access_token = key.signToken(this.performance.stream);
    return this;
  }

  get provisioner() {
    switch (this.provisioner_type) {
      case TokenProvisioner.Purchase:
        return Invoice;
      case TokenProvisioner.User:
        return User;
    }
  }

  toFull(): Required<DtoAccessToken> {
    return {
      _id: this._id,
      access_token: this.access_token, // the token itself to watch said video
      created_at: this.created_at,
      expires_at: this.expires_at,
      provisioner_type: this.provisioner_type,
      provisioner_id: this.provisioner_id,
      performance: this.performance._id,
      user: this.user._id,
      invoice: this.invoice?._id
    };
  }
}
