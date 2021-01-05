import { HostPermission, IUserHostInfo } from "@eventi/interfaces";
import { Host } from "./Host.model";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../Users/User.model";

@Entity()
export class UserHostInfo extends BaseEntity implements IUserHostInfo  {
    @PrimaryGeneratedColumn()  _id: number;
    @Column()                  joined_at: number;
    @Column()                  permissions: HostPermission;

    @OneToOne(() => User) @JoinColumn()                user:User;
    @ManyToOne(() => Host, host => host.members)       host:Host;

    constructor(user:User, host:Host, permissions:HostPermission) {
        super();
        this.user = user;
        // this.host = host;
        this.joined_at = Math.floor(Date.now() / 1000);//timestamp in seconds
        this.permissions = permissions;
    }

    toFull():IUserHostInfo {
        return {
            joined_at: this.joined_at,
            permissions: this.permissions
        }
    }
}