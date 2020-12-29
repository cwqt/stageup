export type Primitive = string | boolean | number;
export type Idless<T> = Omit<T, '_id'>;
