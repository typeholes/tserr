import { ComputedRef } from 'vue';

export type State<T extends string, K extends string[], U> = Readonly<{
  stateName: T;
  get: (...key: K) => U | undefined;
  set: (value: U) => boolean;
  keys: ComputedRef<string[]>;
}>;
