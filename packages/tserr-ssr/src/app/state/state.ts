import { ComputedRef, computed, reactive } from 'vue';
import { assertEq } from '../utilts';

export type State<T extends string, K extends string[], U> = {
  readonly stateName: T;
  readonly toKey: (u: U) => string;
  readonly get: (...key: K) => U | undefined;
  readonly keys: ComputedRef<string[]>;
  readonly values: ComputedRef<U[]>;
  set: (value: U) => boolean;
  remove: (value: U) => boolean;
};

export function mkState<T extends string, K extends string[], U>({
  name,
  map,
  toKey,
  get,
  set,
  remove,
}: {
  name: T;
  map: Map<string, U>;
  toKey: (u: U) => string;
  get: (...key: K) => U | undefined;
  set: (value: U) => boolean;
  remove: (value: U) => boolean;
}) {
  return {
    stateName: name,
    toKey,
    get,
    keys: computed(() => [...map.keys()]),
    values: computed(() => [...map.values()]),
    set,
    remove,
  };
}

export function mkSimpleState<T extends string, U>(
  name: T,
  toKey: (u: U) => string,
  upd?: (existing: U, setting: U) => void,
) {
  const map = reactive(new Map<string, U>());
  return mkState({
    name,
    map,
    toKey,
    get,
    set,
    remove: (u: U) => map.delete(toKey(u)),
  });

  function get(key: string) {
    const u = map.get(key);
    if (u === undefined) {
      return undefined;
    }
    assertEq(key, toKey(u));
    return u;
  }
  function set(u: U): boolean {
    const key = toKey(u);
    const existing = get(key);
    if (existing) {
      if (key === toKey(existing)) {
        if (upd) {
          upd(existing, u);
        }

        return true;
      }
      return false;
    }
    map.set(key, u);
    return true;
  }
}

// standard multi-part key seperator
export const keySep = String.fromCharCode(1);
