import { IPerformance, IPerformanceStub, IRating, NodeType } from "@eventi/interfaces";
import { Host } from "./Host.model";
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.model";

@Entity()
export class Performance extends BaseEntity implements IPerformance {
    @PrimaryGeneratedColumn() _id: number;
    @Column()                 type:NodeType=NodeType.Performance;
    @Column()                 created_at: number;  
    @Column()                 name: string;
    @Column()                 description?: string;
    @Column({nullable:true})  premiere_date?: number;
    @Column({nullable:true})  average_rating: number | null;
    @Column()                 views: number=0;
    @Column({nullable:true})  stream_url: string | null;
    @Column({nullable:true})  VOD_url: string | null;

    @OneToOne(() => Host, {eager:true}) @JoinColumn() host: Host;
    @OneToOne(() => User, {eager:true}) @JoinColumn() creator: User;

    ratings: IRating[];

    constructor(data:Pick<IPerformanceStub, "name" | "description">, creator:User) {
        super();
        this.name = data.name;
        this.description = data.description;
        this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
        this.views = 0;
        this.average_rating = null;
        this.creator = creator;
        this.host = creator.host;
    }

    toStub():IPerformanceStub {
        return {
            _id: this._id,
            host: this.host?.toStub(),
            name: this.name,
            average_rating: this.average_rating,
            type: this.type,
            views: this.views,
            created_at: this.created_at
        }
    }

    toFull():IPerformance {
        return {
            ...this.toStub(),
            ratings: this.ratings,
            stream_url: this.stream_url,
            VOD_url: this.VOD_url
        }
    }
}