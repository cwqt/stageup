import { IPerformance, IPerformanceStub, IRating, NodeType } from "@eventi/interfaces";
import { Host } from "./Host.model";
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.model";
import { ISigningKey } from "@eventi/interfaces/lib/SigningKey.model";

@Entity()
export class SigningKey extends BaseEntity implements ISigningKey {
    @PrimaryGeneratedColumn() _id: number;
    @Column()                 key: string;
    @Column()                 created_at: number;
    @Column()                 type: NodeType;

    constructor() {
        super();
    }
}