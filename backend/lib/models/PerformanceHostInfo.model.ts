import { IPerformance, IPerformanceHostInfo, IPerformanceStub, IRating, NodeType } from "@eventi/interfaces";
import { Host } from "./Host.model";
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.model";
import { ISigningKey } from "@eventi/interfaces/lib/SigningKey.model";
import { SigningKey } from "./SigningKey.model";

@Entity()
export class PerformanceHostInfo extends BaseEntity implements IPerformanceHostInfo {
    @PrimaryGeneratedColumn() _id: number;
    @Column()                 key: string;
    @Column()                 rtmp_url: string;
    @Column()                 stream_key: string;
    @Column()                 created_at: number;
    @Column()                 type: NodeType;

    @OneToOne(() => SigningKey) @JoinColumn()  signing_key: SigningKey;

    constructor() {
        super();
    }
}