import { IHostStub } from "./Users/Host.model";
import { INode } from "./Node.model";
import { IRating } from "./Review.model";
import { IUserStub } from "./Users/User.model";

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
    stream_url: string;
    VOD_url: string | null;
}