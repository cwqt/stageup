import { IPerformance, IPerformanceStub, IRating, NodeType } from "@eventi/interfaces";
import { Host } from "../Hosts/Host.model";
import { BaseEntity, Column, Entity, EntityManager, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../Users/User.model";
import { ISigningKey } from "@eventi/interfaces/lib/SigningKey.model";
import { LiveStream, Video } from '@mux/mux-node';
import { DataClient } from "../../common/data";
import { JWT } from '@mux/mux-node';
import { Performance } from "./Performance.model";

@Entity()
export class SigningKey extends BaseEntity implements ISigningKey {
    @PrimaryGeneratedColumn() _id: number;
    @Column()                 rsa256_key: string;
    @Column()                 mux_key_id: string;
    @Column()                 created_at: number;

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

    signToken(performance:Performance | IPerformance):string {
        return JWT.sign(performance.playback_id, {
            type: 'video',
            keyId: this.mux_key_id,
            keySecret: this.rsa256_key,
            // expiration: string,
            // params: any
        });
    }
}