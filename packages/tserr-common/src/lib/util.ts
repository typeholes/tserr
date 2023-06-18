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
