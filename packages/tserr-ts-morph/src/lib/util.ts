export function group<T>(
  arr: T[],
  getKey: (t: T) => string
): Record<string, T[]> {
  const ret: Record<string, T[]> = {};
  for (const t of arr) {
    const key = getKey(t);
    ret[key] ??= [];
    ret[key].push(t);
  }

  return ret;
}
