import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToOne, ManyToMany } from "typeorm";
import { NodeType, IUser, IUserStub, IUserPrivate, IPerformancePurchase } from "@eventi/interfaces";
import bcrypt from "bcrypt";
import { User } from "./User.model";
import { CurrencyCode } from "@eventi/interfaces/dist/Types/Currency.types";
import { Performance } from './Performance.model';
import { JWT } from '@mux/mux-node';
 
@Entity()
export class Purchase extends BaseEntity implements IPerformancePurchase {
    @PrimaryGeneratedColumn() _id: number;
    @Column()                 date_purchased: number;
    @Column()                 price: number;
    @Column()                 currency: CurrencyCode;
    @Column()                 token: string;
    
    @ManyToOne(() => User, user => user.purchases)        user: User;
    @ManyToOne(() => Performance, perf => perf.purchases) performance: Performance;

    constructor(user:User, performance:Performance) { 
        super()
        this.user = user;
        this.performance = performance;
        this.price = performance.price;
        this.currency = performance.currency;
        this.date_purchased = Math.floor(Date.now() / 1000);//timestamp in seconds
    }

    async setup() {
        const signingKey = this.performance.host_info.signing_key;
        this.token = JWT.sign(this.performance.playback_id, {
            type: 'video',
            keyId: signingKey.mux_key_id,
            keySecret: signingKey.rsa256_key,
            // expiration: string,
            // params: any
        });
    }
}