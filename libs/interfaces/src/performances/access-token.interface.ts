import { NUUID } from '../common/fp.interface';
import { IUser, IUserStub } from '../users/user.interface';
import { IInvoice } from '../common/invoice.interface';

export enum TokenProvisioner {
  User = 'user',
  Purchase = 'purchase'
}

// A token for accessing a performance protected by DRM
// which can be created either by an act of purchasing a performance
// or manually provisioned by a host member sharing a private performance
export type ISignedToken = { signed_token: string; asset_id: string };

export interface IAccessTokenStub {
  _id: NUUID;
  created_at: number;
  expires_at: number;
}

export interface IAccessToken extends IAccessTokenStub {
  // relationships
  user: IUserStub;
  invoice?: IInvoice;

  // polymorphic relationship...except typeorm-polymorphic doesnt support 0.3.0
  provisioner_type: TokenProvisioner;
  provisioner_id: IUser['_id'] | IInvoice['_id'];
}

export type DtoAccessToken = IAccessTokenStub & {
  user?: IUser['_id'];
  invoice?: IInvoice['_id'];
};

export interface DecodedSignedAssetToken {
  alg: 'RS256';
  type: 'JWT';
  kid: string;
  // body
  exp: number;
  aud: string;
  sub: string;
}
// {
//   "alg": "RS256",
//   "typ": "JWT",
//   "kid": "ZeGL1YwICaTEMDS202Q5TjgNRduQZQaJDwspvJEMHml8"
// }
// {
//   "exp": 1618403585,
//   "aud": "v",
//   "sub": "yji4pRyz92kZHygWVkcd01Wk2b2G0238lesEcBS4JGA00E"
// }
