import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from "typeorm";
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
    
    @OneToOne(() => User) @JoinColumn() user: User;
    @OneToOne(() => Performance) @JoinColumn() performance: Performance;

    constructor(data:Pick<IUserPrivate, "username" | "email_address">, password:string) {
        super()
    }    

}