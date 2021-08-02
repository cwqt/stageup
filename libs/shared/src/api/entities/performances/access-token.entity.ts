import { timestamp, uuid } from '@core/helpers';
import { DtoAccessToken, IAccessToken, IAccessTokenStub, TokenProvisioner } from '@core/interfaces';
import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Claim } from '../assets/claim.entity';
import { Invoice } from '../finance/invoice.entity';
import { User } from '../users/user.entity';

@Entity()
export class AccessToken extends BaseEntity implements IAccessToken {
  @PrimaryColumn() _id: string;
  @BeforeInsert() private beforeInsert() {
    this._id = uuid();
  }

  @Column() created_at: number;
  @Column({ nullable: true }) expires_at: number;
  @Column('enum', { enum: TokenProvisioner }) provisioner_type: TokenProvisioner;
  @Column() provisioner_id: string;

  @ManyToOne(() => User) @JoinColumn() user: User;
  @ManyToOne(() => Claim) @JoinColumn() claim: Claim;
  @ManyToOne(() => Invoice) @JoinColumn() invoice?: Invoice;

  constructor(user: User, claim: Claim, provisioner: User | Invoice, type: TokenProvisioner) {
    super();

    this.user = user;
    this.created_at = timestamp();
    this.claim = claim;

    // Wanted to do a polymorphic relationship but it isn't supported....so yeah
    // supertype model
    this.provisioner_id = provisioner._id;
    this.provisioner_type = type;

    if (this.provisioner_type == TokenProvisioner.Purchase) this.invoice = provisioner as Invoice;
  }

  get provisioner() {
    switch (this.provisioner_type) {
      case TokenProvisioner.Purchase:
        return Invoice;
      case TokenProvisioner.User:
        return User;
    }
  }

  toStub(): Required<IAccessTokenStub> {
    return {
      _id: this._id,
      created_at: this.created_at,
      expires_at: this.expires_at
    };
  }

  toFull(): Required<DtoAccessToken> {
    return {
      ...this.toStub(),
      user: this.user._id,
      invoice: this.invoice?._id
    };
  }
}
