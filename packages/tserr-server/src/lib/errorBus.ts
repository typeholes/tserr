import { FlatErr, PluginName, pair } from '@typeholes/tserr-common';

type SnappedError = FlatErr & {
  snapId: number;
  firstSnapId: number;
  errId: number;
  fileName: string;
};

let errId = 0;
export const fileErrors: Record<string, ReturnType<typeof mkSnapshot>> = {};

export function addFile(fileName: string) {
  if (fileName in fileErrors) {
    return fileErrors[fileName];
  }

  fileErrors[fileName] = mkSnapshot(fileName);
  return fileErrors[fileName];
}

function mkSnapshot(fileName: string) {
  let state = {
    snapId: 0,
    errors: [] as SnappedError[],
    fixed: [] as SnappedError[],
  };

  function snapshot() {
    const snapId = state.snapId + 1;

    state = {
      snapId,
      ...splitBy(state.errors, (e) =>
        pair(e.snapId === snapId ? 'errors' : 'fixed', e),
      ),
    };

    return state;
  }

  function updateErrors(fromPlugin: PluginName, newErrors: FlatErr[]) {
    const diff = splitBy(newErrors, (err) => {
      const ret = pair('new', { ...err, updateIdx: -1 });
      for (let i = 0; i < state.errors.length; i++) {
        const old = state.errors[i];
        const check = eq(err, old);
        if (check(['span','parsed'])) {
          ret[0] = 'exact';
          ret[1].updateIdx = i;
          break;
        }
      }
      return ret;
    });

    for (const diffType in diff) {
      if (diffType === 'new') {
        continue;
      }
      for (const err of diff[diffType]) {
        state.errors[err.updateIdx] = {
          ...err,
          snapId: state.snapId,
          firstSnapId: state.errors[err.updateIdx].firstSnapId,
          errId: state.errors[err.updateIdx].errId,
          fileName,
          sources: { ...err.sources, ...state.errors[err.updateIdx].sources}
        };
      }
    }

    for (const err of diff.new ?? []) {
      state.errors.push({
        ...err,
        snapId: state.snapId,
        firstSnapId: state.snapId,
        errId: errId++,
        fileName,
        sources: err.sources,
      });
    }
  }

  return { getState: () => state, updateErrors, snapshot };
}

function splitBy<T, U, K extends string>(arr: T[], by: (t: T) => [K, U]) {
  const ret: Record<K, U[]> = {} as never;

  for (const t of arr) {
    const [k, u] = by(t);
    ret[k] ??= [];
    ret[k]?.push(u);
  }

  return ret;
}

function eq<KA extends KB, KB extends string, VA extends VB, VB>(
  a: Record<KA, VA>,
  b: Record<KB, VB>,
): (keys: KA[]) => boolean {
  return (keys: KA[]) => keys.every((k) => a[k] === b[k]);
}

type ex<A, B> = A extends B ? 1 : 0;

type A = ex<{ a: 1; b: 1 }, { b: 1 }>;
