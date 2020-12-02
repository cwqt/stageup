import { IHostStub } from "./Users/Host.model";
import { INode } from "./Node.model";
import { IRating } from "./Review.model";
export interface IPerformanceStub extends INode {
    host: IHostStub;
    name: string;
    description?: string;
    premiere_date?: number;
    average_rating: number;
    views: number;
}
export interface IPerformance {
    ratings: IRating[];
    stream_url: string;
    VOD_url: string | null;
}
