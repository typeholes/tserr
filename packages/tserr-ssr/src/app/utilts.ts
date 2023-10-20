export function assertEq<B>(a: unknown, b: B): asserts a is B {
  if (a !== b) {
    throw new Error(`${a} !== ${b}`);
  }
}

export function arrayEq<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function shallowObjEq<T extends Record<PropertyKey, unknown>>(
  a: T,
  b: T,
): boolean {
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false;
  }

  for (const key in a) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}
