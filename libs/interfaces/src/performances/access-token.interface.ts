import { NUUID } from "../common/fp.interface";
import { IUser, IUserStub } from "../users/user.interface";
import { IPerformance } from "./performance.interface";
import { Except } from 'type-fest';
import { IInvoice } from "../common/invoice.interface";

export enum TokenProvisioner {
  User = "user",
  Purchase = "purchase"
}

// A token for accessing a performance protected by DRM
// which can be created either by an act of purchasing a performance
// or manually provisioned by a host member sharing a private performance
export interface IAccessToken {
  _id: NUUID;
  access_token: string; // the token itself to watch said video
  created_at: number;
  expires_at: number;
  provisioner_type: TokenProvisioner;

  // relationships
  user: IUserStub;
  invoice: IInvoice;
  // polymorphic relationship...except typeorm-polymorphic doesnt support 0.3.0
  provisioner_id: IUser["_id"] | IInvoice["_id"];
}

export type DtoAccessToken = Except<IAccessToken, "user" | "invoice"> & {
  user?: IUser["_id"];
  invoice?: IInvoice["_id"];
  performance: IPerformance["_id"];
}
