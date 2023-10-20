import { ComputedRef, computed } from 'vue';

export type State<T extends string, K extends string[], U> = {
  readonly stateName: T;
  readonly get: (...key: K) => U | undefined;
  set: (value: U) => boolean;
  readonly keys: ComputedRef<string[]>;
};

export function mkState<T extends string, K extends string[], U>(
  name: T,
  map: Map<string, U>,
  get: (...key: K) => U | undefined,
  set: (value: U) => boolean,
) {
  return {
    stateName: name,
    get,
    set,
    keys: computed(() => [...map.keys()]),
  };
}
