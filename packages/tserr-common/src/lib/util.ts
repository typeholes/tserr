import { ValueMap } from './ValueMap';

export function uniqObjects<T extends object>(...objects: T[][]): T[] {
  const map = new ValueMap<T, undefined, string>(JSON.stringify);
  for (const obj of objects) {
    for (const entry of obj) {
      map.set(entry, undefined);
    }
  }
  return Array.from(map.keys());
}

export type U2T<T> = (T extends T ? (x: () => T) => 0 : 0) extends (
  v: infer U,
) => 0
  ? U extends () => infer V
    ? [...U2T<Exclude<T, V>>, V]
    : []
  : [];

export function tupleToObject<T>(keys: U2T<keyof T>) {
  return <U>(mkValue: (key: keyof T) => U) =>
    Object.fromEntries(keys.map((k) => [k, mkValue(k)] as const)) as {
      [P in keyof T]: U;
    };
}

export function relPath(rootRaw: string, pathRaw: string) {
  const root = rootRaw.replaceAll('\\', '/');
  let path = pathRaw.replaceAll('\\', '/');
  if (path.startsWith('./')) {
    path = path.slice(2);
  }
  const p = './' + (path.startsWith(root) ? path.replace(root, '') : path);
  const ret = p.replaceAll(/\/\/+/g, '/').replace(/\.$/, '');
  console.log('relPath', ret);
  return ret;
}

export function absPath(root: string, path: string) {
  return path.startsWith(root) ? path : root + '/' + path.replace(root, '');
}

export function pair<T, U>(t: T, u: U): [T, U] {
  return [t, u];
}

export function eq<A, B extends A>(a: A, b: B): boolean {
  if (typeof a !== typeof b) {
    return false;
  }
  if (a === null && b === null) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => eq(v, b[i]));
  }
  if (typeof a === 'object') {
    if (!eq(Object.keys(a!), Object.keys(b!))) {
      return false;
    }
    for (let k in a) {
      if (!eq(a[k as never], b[k as never])) {
        return false;
      }
    }
    return true;
  }

  return a === b;
}
