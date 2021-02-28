import { NUUID } from "../common/fp.interface";
import { IUser, IUserStub } from "../users/user.interface";
import { IPerformancePurchase } from "./performance-purchase.interface";
import { IPerformanceStub } from "./performance.interface";
import { Except } from 'type-fest';

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
  performance: IPerformanceStub
  // polymorphic relationship...except typeorm-polymorphic doesnt support 0.3.0
  provisioner_id: IUser["_id"] | IPerformancePurchase["_id"];
}

export type DtoAccessToken = Except<IAccessToken, "user" | "performance"> & {
  user: IUser["_id"];
  performance: IPerformanceStub["_id"];
}
