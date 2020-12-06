import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { NodeType, IHost, IHostStub } from "@eventi/interfaces";
import { User } from './User.model';
import { Performance } from "./Performance.model";
 
@Entity()
export class Host extends BaseEntity implements IHost {
  @PrimaryGeneratedColumn()     _id: number;
  @Column()                     created_at: number;
  @Column()                     type: NodeType=NodeType.Host;
  @Column()                     name: string;
  @Column()                     username: string;
  @Column({ nullable: true})    bio?: string;
  @Column({ nullable: true})    avatar: string;

  @OneToMany(() => User, user => user.host, { cascade: true, eager: true }) members:User[];
  @OneToMany(() => Performance, performance => performance.host)            performances: Performance[];

  constructor(data:Pick<IHost, "name" | "username">, creator:User) {
    super();
    this.created_at = Math.floor(Date.now() / 1000);//timestamp in seconds
    this.username = data.username;
    this.name = data.name;
    this.members = [creator];
  }

  toStub():IHostStub {
    return {
      _id: this._id,
      name: this.name,
      username: this.username,
      type: this.type,
      created_at: this.created_at
    };
  }

  toFull():IHost {
    return {
      ...this.toStub(),
      members: this.members?.map((u:User) => u.toStub()) || []
    };
  } 

}

