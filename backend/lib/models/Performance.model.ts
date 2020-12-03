import { IPerformance, IPerformanceHostInfo, IPerformanceStub, IRating, NodeType, PerformanceState } from "@eventi/interfaces";
import { Host } from "./Host.model";
import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.model";
import { SigningKey } from "./SigningKey.model";
import { PerformanceHostInfo, PerformanceHostInfo as PHostInfo } from "./PerformanceHostInfo.model";
import { DataClient } from "../common/data";
import { CurrencyCode } from "@eventi/interfaces/dist/Types/Currency.types";

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
  @Column({nullable:true})  state: PerformanceState;
  @Column()                 price: number;
  @Column()                 currency: CurrencyCode;

  @OneToOne(() => Host, {eager:true}) @JoinColumn() host: Host;
  @OneToOne(() => User, {eager:true}) @JoinColumn() creator: User;
  @OneToOne(() => PHostInfo) @JoinColumn()          host_info: PHostInfo;

  ratings: IRating[];

  constructor(data:Pick<IPerformanceStub, "name" | "description"> &
    Pick<IPerformance, "price" | "currency">, creator:User) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    this.views = 0;
    this.average_rating = null;
    this.creator = creator;
    this.host = creator.host;
    this.state = PerformanceState.Idle;
  }

  async setup(dc:DataClient):Promise<Performance> {
    // create host info, which includes a signing key, thru atomic trans op
    await dc.torm.transaction(async transEntityManager => {
      this.host_info = await (new PerformanceHostInfo()).setup(dc, transEntityManager);
      await transEntityManager.save(this);
    });

    return this;
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
      state: this.state,
      price: this.price,
      currency: this.currency
    }
  }
}