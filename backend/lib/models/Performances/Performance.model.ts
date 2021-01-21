import { IPerformance, IPerformanceStub, IRating, PerformanceState } from "@eventi/interfaces";
import { Host } from "../Hosts/Host.model";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../Users/User.model";
import { PerformanceHostInfo, PerformanceHostInfo as PHostInfo } from "./PerformanceHostInfo.model";
import { DataClient } from "../../common/data";
import { CurrencyCode } from "@eventi/interfaces";
import { Purchase } from "../Purchase.model";
import { unixTimestamp } from "../../common/helpers";
@Entity()
export class Performance extends BaseEntity implements IPerformance {
  @PrimaryGeneratedColumn() _id: number;
  @Column()                 created_at: number;
  @Column()                 name: string;
  @Column()                 description?: string;
  @Column({nullable:true})  premiere_date?: number;
  @Column({nullable:true})  average_rating: number | null;
  @Column()                 views: number=0;
  @Column({nullable:true})  state: PerformanceState;
  @Column()                 price: number;
  @Column()                 currency: CurrencyCode;
  @Column()                 playback_id: string;
  
  @OneToOne(() => PHostInfo) @JoinColumn()                      host_info: PHostInfo;
  @ManyToOne(() => Host, host => host.performances)             host: Host;
  @ManyToOne(() => User, user => user.performances)             creator: User;
  @OneToMany(() => Purchase, purchase => purchase.performance)  purchases:Purchase[];

  ratings: IRating[];

  constructor(data:Pick<IPerformanceStub, "name" | "description"> &
    Pick<IPerformance, "price" | "currency">, creator:User) {
    super();
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.currency = data.currency

    this.created_at = unixTimestamp(new Date());
    this.views = 0;
    this.average_rating = null;
    this.creator = creator;
    this.host = creator.host;
    this.state = PerformanceState.Idle;
  }

  async setup(dc:DataClient):Promise<Performance> {
    // create host info, which includes a signing key, thru atomic trans op
    await dc.torm.transaction(async transEntityManager => {
      const [ hostInfo, stream ] = await (new PerformanceHostInfo()).setup(dc, transEntityManager);
      this.host_info = hostInfo;
      this.playback_id = stream.playback_ids.find(p => p.policy == 'signed').id;

      await transEntityManager.save(this);
    });

    return this;
  }

  toStub():Required<IPerformanceStub> {
    return {
      _id: this._id,
      host: this.host?.toStub(),
      name: this.name,
      average_rating: this.average_rating,
      views: this.views,
      description: this.description,
      playback_id: this.playback_id
    }
  }

  toFull(): Required<IPerformance> {
    return {
      ...this.toStub(),
      created_at: this.created_at,
      premiere_date: this.premiere_date,
      ratings: this.ratings,
      state: this.state,
      price: this.price,
      currency: this.currency,
    }
  }

  async update(updates:Partial<Pick<IPerformance, "name" | "description" | "price">>):Promise<Performance> {
    Object.entries(updates).forEach(([k,v]:[string,any]) => {
      (<any>this)[k] = v ?? (<any>this)[k];
    })  

    return await this.save();
  }
}

