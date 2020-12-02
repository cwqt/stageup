import { IHostStub } from "./Users/Host.model";
import { INode } from "./Node.model";
import { IRating } from "./Review.model";
import { IUserStub } from "./Users/User.model";
import { ISigningKey } from './SigningKey.model';

export interface IPerformanceStub extends INode {
    host: IHostStub; // who created the performance
    name: string; // title of performance
    description?:string; // description of performance
    premiere_date?: number; // when the performance is ready to be streamed
    average_rating: number; // average rating across all ratings
    views: number;  // total user view count
}

export interface IPerformance {
    ratings: IRating[]; // user ratings on performance
    state: PerformanceState; // status of stream
}

// private to host
export interface IPerformanceHostInfo {
    signing_key?: Omit<ISigningKey, "key">
    rtmp_url: string;
    stream_key: string;
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