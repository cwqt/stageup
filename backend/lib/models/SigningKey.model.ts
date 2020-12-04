import { IPerformance, IPerformanceStub, IRating, NodeType } from "@eventi/interfaces";
import { Host } from "./Host.model";
import { BaseEntity, Column, Entity, EntityManager, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.model";
import { ISigningKey } from "@eventi/interfaces/lib/SigningKey.model";
import { LiveStream, Video } from '@mux/mux-node';
import { DataClient } from "../common/data";

@Entity()
export class SigningKey extends BaseEntity implements ISigningKey {
    @PrimaryGeneratedColumn() _id: number;
    @Column({select:false})   rsa256_key: string;
    @Column()                 mux_key_id: string;
    @Column()                 created_at: number;
    @Column()                 type: NodeType=NodeType.SigningKey;

    constructor() {
        super();
        this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    }
    
    async setup(dc:DataClient, transEntityManager:EntityManager):Promise<SigningKey> {
        //https://docs.mux.com/reference#url-signing-keys
        const signingKey = await (<any>dc).mux.Video.SigningKeys.create();

        // response isn't actually enveloped - great docs :)
        this.mux_key_id = signingKey.id;
        this.rsa256_key = signingKey.private_key;

        await transEntityManager.save(this);
        return this;
    }
}