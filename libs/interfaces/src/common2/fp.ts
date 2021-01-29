export type Primitive = string | boolean | number;
export type Idless<T> = Omit<T, '_id'>;

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

// Typed nested object dot accessor -----------------------------------------------------
// FIXME: angular 11.1.0 supports ts 4.1 which is whats required for template string types
// which came out 18 hrs before now 21/01/20 2:17 so unfortunately it's bugged as fuck right now
// we'll have to do this later i guess when things are advanced some in the versioning
export type DottedPaths<T> = string;

// type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
// type DottablePaths<T, P extends Prev[number] = 10> = [] | ([P] extends [never] ? never :
//     T extends readonly any[] ? never :
//     T extends object ? {
//         [K in ExtractDottable<keyof T>]: [K, ...DottablePaths<T[K], Prev[P]>]
//     }[ExtractDottable<keyof T>] : never);

// type DottedPaths<T> = Join<Extract<DottablePaths<T>, string[]>, ".">;

// type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
// type BadChars = '~' | '`' | '!' | '@' | '#' | '%' | '^' | '&' | '*' | '(' | ')' | '-' | '+'
//     | '=' | '{' | '}' | ';' | ':' | '\'' | '"' | '<' | '>' | ',' | '.' | '/' | '?'
// type ExtractDottable<K extends PropertyKey> =
//     K extends string ? string extends K ? never :
//     K extends `${Digit}${infer _}` | `${infer _}${BadChars}${infer _}` ? never :
//     K
//     : never

// type Join<T extends string[], D extends string> =
//     T extends [] ? never :
//     T extends [infer F] ? F :
//     T extends [infer F, ...infer R] ?
//     F extends string ? string extends F ? string : `${F}${D}${Join<Extract<R, string[]>, D>}` : never : string;

// export const objectToFlatMap = () => {};
// export const flatMapToObject = () => {};