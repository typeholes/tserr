export function valueMap<K extends object, V>(k: K, v: V) {
  return new ValueMap<K, V, string>(JSON.stringify).set(k, v);
}

export class ValueMap<K extends object, V, S extends PropertyKey = never>
  implements Map<K, V>
{
  internal: Map<S, [K, V]>;
  surrogate;
  monoid;

  constructor(
    surrogate: (key: K) => S,
    monoid?: (a: V, b: V) => V,
    iterable?: Iterable<readonly [K, V]> | null | undefined,
    wrapper: <T>(t: T) => T = (x) => x,
  ) {
    this.internal = wrapper(
      new Map(
        !iterable
          ? undefined
          : (function* () {
              for (const [key, value] of iterable!) {
                yield [surrogate(key), [key, value]];
              }
            })(),
      ),
    );
    this.surrogate = surrogate;
    this.monoid = monoid ?? ((_, b) => b);
  }

  clear(): void {
    this.internal.clear();
  }

  delete(key: K): boolean {
    return this.internal.delete(this.surrogate(key));
  }

  forEach(
    callbackfn: (value: V, key: K, map: ValueMap<K, V, S>) => void,
  ): void {
    this.internal.forEach(([key, value]) => callbackfn(value, key, this));
  }

  get(key: K): V | undefined {
    return this.internal.get(this.surrogate(key))?.[1];
  }

  has(key: K): boolean {
    return this.internal.has(this.surrogate(key));
  }

  set(key: K, value: V): this {
    let v = this.get(key);
    v = v === undefined ? value : this.monoid(v, value);
    this.internal.set(this.surrogate(key), [key, v]);
    return this;
  }

  update(key: K, fn: (v: V) => V): this {
    const v = this.get(key);
    if (v === undefined) {
      return this;
    }

    this.set(key, fn(v));

    return this;
  }

  get size(): number {
    return this.internal.size;
  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    for (const [_, pair] of this.internal) {
      yield pair;
    }
  }

  static {
    Object.defineProperty(this, 'entries', {
      value: this.prototype[Symbol.iterator],
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }

  *keys(): IterableIterator<K> {
    for (const [, [key]] of this.internal) {
      yield key;
    }
  }

  *values(): IterableIterator<V> {
    for (const [, [, value]] of this.internal) {
      yield value;
    }
  }

  *rawEntries(): IterableIterator<[K, V]> {
    for (const [, e] of this.internal) {
      yield e;
    }
  }

  get [Symbol.toStringTag]() {
    return 'ValueMap';
  }
}
export interface ValueMap<K, V, S extends PropertyKey = never> {
  entries(): IterableIterator<[K, V]>;
}
