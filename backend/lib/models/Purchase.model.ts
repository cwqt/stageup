import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToOne, ManyToMany } from "typeorm";
import { NodeType, IUser, IUserStub, IUserPrivate, IPerformancePurchase } from "@eventi/interfaces";
import bcrypt from "bcrypt";
import { User } from "./User.model";
import { CurrencyCode } from "@eventi/interfaces/dist/Types/Currency.types";
import { Performance } from './Performance.model';
 
@Entity()
export class Purchase extends BaseEntity implements IPerformancePurchase {
    @PrimaryGeneratedColumn() _id: number;
    @Column()                 date_purchased: number;
    @Column()                 price: number;
    @Column()                 currency: CurrencyCode;
    
    @ManyToOne(() => User, user => user.purchases)  @JoinColumn() user: User;
    @ManyToOne(() => Performance)                   @JoinColumn() performance: Performance;

    constructor(user:User, performance:Performance) { 
        super()
        this.user = user;
        this.performance = performance;
        this.price = performance.price;
        this.currency = performance.currency;
        this.date_purchased = Math.floor(Date.now() / 1000);//timestamp in seconds
    }    
}