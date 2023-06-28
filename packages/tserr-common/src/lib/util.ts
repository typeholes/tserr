export type U2T<T> = (T extends T ? (x: () => T) => 0 : 0) extends (
  v: infer U
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

export function relPath(root: string, path: string, sep: string) {
  const double = new RegExp(`\\${sep}\\${sep}`);
  const p =  ('.' + sep + (path.startsWith(root) ? path.replace(root, '') : path
  ));
  console.log('relPath', p);
  return p.replace(double, '').replace(/\.$/,'');
}

export function absPath(root: string, path: string, sep: string) {
  return path.startsWith(root) ? path : root + sep + path.replace(root, '');
}
