import { NodeType } from "./Types/Nodes.types";

// Y-combinator
type M<A extends any[], R> = (f: M<A, R>) => (...a: A) => R
export const Y = <A extends any[], R>(
  f: (g: (...a: A) => R) => (...a: A) => R
): ((...a: A) => R) =>
  ((m: M<A, R>) =>
    f((...x) => m(m)(...x))
  )((m: M<A, R>) =>
    f((...x) => m(m)(...x))
  )

export const capitalize = (str: NodeType | string): string => str.charAt(0).toUpperCase() + str.slice(1);