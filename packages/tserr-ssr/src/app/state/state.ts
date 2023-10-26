export function mkState<N, T, K extends readonly PropertyKey[]>(
  name: N,
  toKeys: (t: T) => K,
) {
  const obj: Record<PropertyKey, any> = {};
  function getParent(t: T): [PropertyKey, Record<PropertyKey, [T]>] {
    const keys = toKeys(t);
    let at = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      at[keys[i]] ??= {};
      at = at[keys[i]];
    }
    return [keys[keys.length - 1], at];
  }
  const state = {
    name,
    add: (t: T) => {
      const [k, at] = getParent(t);
      //console.log(k, at);
      const existing = (at[k]??[])[0];
      // if (existing) { console.log({ t, existing, atK: at[k] }); }
      at[k] = [existing ? state.merge(existing, t) : t];
      for (const on of state.onMutate) {
        on('add', t, existing, at[k][0]);
      }
      //console.log(obj);
    },
    get: (t: T): T | undefined => {
      const [k, at] = getParent(t);
      return at[k][0];
    },
    getByKeys: (...keys: K) => {
      let at: Record<PropertyKey, any> = obj;
      for (const k of keys) {
        at = at[k];
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
    },
    values: (...keys: PropertyKey[]) => {
      const ret: T[] = [];
      let at: Record<PropertyKey, any> = obj;
      for (const k of keys) {
        at = at[k];
      }
      getObjects(at, ret);
      return ret;
    },
    log: () => console.log(JSON.stringify(obj, null, 2)),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    merge: (a: T, b: T) => a,
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
