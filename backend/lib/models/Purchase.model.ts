import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToOne, ManyToMany } from "typeorm";
import { IUser, IUserStub, IUserPrivate, IPerformancePurchase } from "@eventi/interfaces";
import bcrypt from "bcrypt";
import { User } from "./Users/User.model";
<<<<<<< HEAD
// import { CurrencyCode } from "@eventi/interfaces/dist/Types/Currency.types";
=======
import { CurrencyCode } from "@eventi/interfaces";
>>>>>>> c13efda6a5befba46a3d18c15116a16aec61e72b
import { Performance } from './Performances/Performance.model';
 
@Entity()
export class Purchase extends BaseEntity {
    @PrimaryGeneratedColumn()                _id: number;
    @Column()                                date_purchased: number;
    @Column({type:"bigint", nullable:true})  price: number; // stored as micro-pence
    // @Column()                                currency: CurrencyCode;
    @Column()                                token: string;
    @Column()                                payment_id: number;
    @Column()                                expiry: number;
    @Column()                                key_id: string; // signing-key
    
    
    @ManyToOne(() => User, user => user.purchases)        user: User;
    @ManyToOne(() => Performance, perf => perf.purchases) performance: Performance;

    constructor(user:User, performance:Performance) { 
        super()
        this.user = user;
        this.performance = performance;
        this.price = performance.price;
        // this.currency = performance.currency;
        this.date_purchased = Math.floor(Date.now() / 1000);//timestamp in seconds
    }
}