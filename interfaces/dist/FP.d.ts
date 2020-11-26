import { NodeType } from "./Types/Nodes.types";
export declare const Y: <A extends any[], R>(f: (g: (...a: A) => R) => (...a: A) => R) => (...a: A) => R;
export declare const capitalize: (str: NodeType | string) => string;
