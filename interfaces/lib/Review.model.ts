import { INode } from "./Node.model";
import { IUserStub } from "./User.model";

export interface IRating extends INode {
    rating: 1 | 2 | 3 | 4 | 5; // 1-5 star rating system
    comment?: string; // user review
    user: IUserStub; // who made the review    
}