import { NodeType } from './Nodes.types';

export const capitalize = (str: NodeType | string): string => str.charAt(0).toUpperCase() + str.slice(1);

type M<A extends any[], R> = (f: M<A, R>) => (...a: A) => R;

/**
 * @description Y-combinator
 * @example Y(r => x => r(x));
 */
export const Y = <A extends any[], R>(f: (g: (...a: A) => R) => (...a: A) => R): ((...a: A) => R) =>
  ((m: M<A, R>) => f((...x) => m(m)(...x)))((m: M<A, R>) => f((...x) => m(m)(...x)));

/**
 * @description in-place object array sorter
 */
export const sortObjects = <T, K extends keyof T>(values: T[], orderType: K) => {
  return values.sort((a, b) => {
    if (a[orderType] < b[orderType]) return -1;
    if (a[orderType] > b[orderType]) return 1;
    return 0;
  });
};

