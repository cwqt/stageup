import { INode } from "./Node.model";

export interface ISigningKey extends INode {
    rsa256_key: string;
    mux_key_id: string;
}