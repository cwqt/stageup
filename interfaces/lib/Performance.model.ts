import { IHostStub } from "./Host.model";
import { INode } from "./Node.model";
import { IRating } from "./Review.model";
import { ISigningKey } from './SigningKey.model';
import { CurrencyCode } from "./Currency.types";

export interface IPerformanceStub extends INode {
    host: IHostStub; // who created the performance
    name: string; // title of performance
    description?:string; // description of performance
    premiere_date?: number; // when the performance is ready to be streamed
    average_rating: number; // average rating across all ratings
    views: number;  // total user view count
    playback_id: string; // address to view
}

export interface IPerformance extends IPerformanceStub {
    ratings: IRating[]; // user ratings on performance
    state: PerformanceState; // status of stream
    price: number; // cost to purchase
    currency: CurrencyCode; // currency of price

    __user_access?: IPerformanceUserInfo; // data for the client
}

// private to host
export interface IPerformanceHostInfo {
    stream_key: string;
    signing_key?: Omit<ISigningKey, "rsa256_key">
}

export interface IPerformanceUserInfo {
    signed_token:string;
    expires:boolean;
    purchase_id:number;
}

export enum PerformanceState {
    //https://docs.mux.com/docs/live-streaming
    Connected = "video.live_stream.connected", 
    Disconnected = "video.live_stream.disconnected", 
    Recording = "video.live_stream.recording", 
    Active = "video.live_stream.active", 
    Idle = "video.live_stream.idle",
    StreamCompleted = "video.asset.live_stream_completed"
}