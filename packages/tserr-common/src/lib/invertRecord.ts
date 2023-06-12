export function invertRecord<K extends PropertyKey, V extends PropertyKey>(
  rec: Record<K, V[]>
): Record<V, K> {
  const ret: Record<V, K> = {} as never;
  for (const k in rec) {
    for (const v of rec[k]) {
      if (ret[v] !== undefined) {
        throw new Error(`duplicate value ${v.toString()}`);
      }
      ret[v] = k;
    }
  }
  return ret;
}
