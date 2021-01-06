export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

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

/**
 * @description Pick fields from an object
 * @param obj Object to pick from
 * @param paths Fields to pick from object
 */
export const pick = <T extends object, U extends keyof T>(obj: T, paths: Array<U>): Pick<T, U> => {
  const ret = Object.create(null);
  for (const k of paths) {
    ret[k] = obj[k];
  }
  return ret;
};
