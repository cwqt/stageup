import { NodeType } from "./Nodes.types";

export type Primitive = string | boolean | number;
export type Idless<T> = Omit<T, "_id">;