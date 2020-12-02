import { INode } from "./Node.model";

export interface IPerformancePurchase extends INode {
    ticketmaster_id: string; // some ticketmaster shit
    playback_id: string; // MUX video playback ID
    expiry: number; //UNIX epoch
    key_id: string; // Signing Key ID
}