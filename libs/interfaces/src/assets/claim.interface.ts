import { IAssetStub } from './asset.interface';

// Tickets have a Claim, Claims map to Assets
// Tickets by proxy provision access to Assets through an AssetToken
// Users own AccessTokens that give them permissions to view all Assets of a Claim
/**
 *
 *            Ticket   Subscription
 *              \          /
 *              ',       ,'
 * Asset <-.|_    `.   .'    _.- AssetToken --> User
 *          | `'.   v  v   .'
 * Asset <--|---+- Claim <+------ AssetToken --> User
 *          | _.'           ',
 * Asset <-'|`                `.- AssetToken --> User
 *    ClaimAssetPivot
 */
export interface IClaim {
  _id: string;
  claims: IAssetStub[];
  expires_at: number;
}
