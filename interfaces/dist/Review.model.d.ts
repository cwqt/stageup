import { INode } from "./Node.model";
import { IUserStub } from "./Users/User.model";
export interface IRating extends INode {
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
    user: IUserStub;
}
