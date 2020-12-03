import { IPerformanceHostInfo, IPerformanceStub, IRating, NodeType } from "@eventi/interfaces";
import { Host } from "./Host.model";
import { BaseEntity, Column, Entity, EntityManager, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.model";
import { ISigningKey } from "@eventi/interfaces/lib/SigningKey.model";
import { SigningKey } from "./SigningKey.model";
import { DataClient } from "../common/data";
import config from '../config';
import { LiveStream } from "@mux/mux-node";
@Entity()
export class PerformanceHostInfo extends BaseEntity implements IPerformanceHostInfo {
    @PrimaryGeneratedColumn() _id: number;
    @Column({nullable:true})  key: string;
    @Column({nullable:true})  rtmp_url: string;
    @Column({nullable:true})  stream_key: string;
    @Column()                 created_at: number;
    @Column()                 type: NodeType=NodeType.PerformanceHostInfo;

    @OneToOne(() => SigningKey) @JoinColumn()  signing_key: SigningKey;

    constructor() {
        super();
        this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    }

    async setup(dc:DataClient, transEntityManager:EntityManager):Promise<PerformanceHostInfo> {
        //https://docs.mux.com/reference#create-a-live-stream
        const stream = await dc.mux.Video.LiveStreams.create({
            reconnect_window: 300,      // time to wait for reconnect on signal loss
            playback_policy: "signed",  // requires token
            new_asset_settings: {},
            passthrough: "",            //arbitrary passthru data inc. in LS object
            reduced_latency: false,
            simulcast_targets: [],      // for 3rd party re-streaming
            test: !config.PRODUCTION    // no cost during testing/dev
        });

        this.stream_key = stream.stream_key;

        // create a signing key associated with this stream
        // so we can sign JWTs for PerformancePurchases on this Perf only
        const signingKey = await(new SigningKey()).setup(dc, transEntityManager);
        this.signing_key = signingKey;

        await transEntityManager.save(this);
        return this;
    }
}