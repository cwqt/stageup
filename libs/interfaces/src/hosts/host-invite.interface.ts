import { IUserStub } from "../users/user.interface";
import { IHostStub } from "./host.interface";

export enum HostInviteState {
  Accepted,
  Pending,
  Expired
}

export interface IHostInvitation {
  _id: string;
  expires_at: number;
  created_at: number;
  state: HostInviteState;
  inviter: IUserStub; // who made the invitation
  invitee: IUserStub; // who it invites
  host: IHostStub; // invited to this host
}