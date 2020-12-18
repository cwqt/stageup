import { IUserStub } from "../Users/User.model";
export interface IRating {
    _id: number;
    created_at:number;
    rating: 1 | 2 | 3 | 4 | 5; // 1-5 star rating system
    comment?: string; // user review
    user: IUserStub; // who made the review    
}