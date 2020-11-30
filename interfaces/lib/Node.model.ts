import { NodeType } from "./Types/Nodes.types";

export type Primitive = string | boolean | number;
export type Idless<T> = Omit<T, "_id">;

export interface INode {
  _id: number;
  created_at: number;
  type: NodeType;
}

export interface Paginated<T> {
  results: T[];
  next: string;
  prev: string;
  total: number;
  pages: number;
}
