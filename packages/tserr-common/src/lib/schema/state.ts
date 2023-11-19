import { reactive } from 'vue';

// type NoInfer<T> = [T][T extends T ? 0 : never];
export type Evaluate<t> = t; // { [k in keyof t]: t[k] } & unknown;

export type State<N extends string, T, K extends readonly PropertyKey[]> = {
  stateName: N;
  add: (t: T) => void;
  get: (t: T) => T | undefined;
  getByKeys: (...keys: K) => T | undefined;
  remove: (t: T) => boolean;
  values: (...keys: Partial<K>) => T[];
  log: () => void;
  merge: (a: T, b: T) => T;
  toKeys: (t: T) => K;
  onMutate: ((
    action: string,
    arg: T,
    existing: T | undefined,
    merged?: T,
  ) => void)[];
};

export function mkState<
  /*const*/ N extends string,
  T,
  /*const*/ K extends readonly PropertyKey[],
>(stateName: N, toKeys: (t: T) => K, clonable = false): State<N, T, K> {
  const obj: Record<PropertyKey, any> = reactive({});
  function getParent(t: T): [PropertyKey, Record<PropertyKey, [T]>] {
    const keys = toKeys(t);
    let at = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      at[keys[i]] ??= {};
      at = at[keys[i]];
    }
    return [keys[keys.length - 1], at];
  }
  const state: State<N, T, K> = {
    stateName: stateName,
    add: (origT: T) => {
      const t = clonable ? structuredClone(origT) : { ...origT };
      const [k, at] = getParent(t);
      //console.log(k, at);
      const existing = (at[k] ?? [])[0];
      // if (existing) { console.log({ t, existing, atK: at[k] }); }
      at[k] = [existing ? state.merge(existing, t) : t];
      for (const on of state.onMutate) {
        on('add', t, existing, at[k][0]);
      }
      //console.log(obj);
    },
    get: (t: T): T | undefined => {
      const [k, at] = getParent(t);
      if (at === undefined || at[k] === undefined) return undefined;
      return at[k][0];
    },
    getByKeys: (...keys: K) => {
      let at: Record<PropertyKey, any> = obj;
      for (const k of keys) {
        at = at[k];
        if (at === undefined) return undefined;
      }
      return at[0] as T | undefined;
    },
    remove: (t: T) => {
      const [k, at] = getParent(t);
      const existing = at[k][0];
      delete at[k];
      for (const on of state.onMutate) {
        on('remove', t, existing);
      }
      return existing !== undefined;
    },
    values: (...keys: Partial<K>) => {
      const ret: T[] = [];
      let at: Record<PropertyKey, any> = obj;
      for (const k of keys) {
        if (k === undefined) break;
        at = at[k];
        if (at == undefined) return [];
      }
      getObjects(at, ret);
      return ret;
    },
    log: () => console.log(JSON.stringify(obj, null, 2)),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    merge: (a: T, b: T) => a,
    toKeys,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onMutate: [] as ((
      action: string,
      arg: T,
      existing: T | undefined,
      merged?: T,
    ) => void)[],
  };

  return state;
}

function getObjects(obj: Record<PropertyKey, any>, into: any[]) {
  for (const k in obj) {
    const val = obj[k];
    if (Array.isArray(val)) {
      into.push(val[0]);
    } else {
      getObjects(val, into);
    }
  }
}
