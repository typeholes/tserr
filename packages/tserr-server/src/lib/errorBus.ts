import {
  FlatErr,
  FlatErrKey,
  FlatErrValue,
  PluginName,
  ValueMap,
  eq,
  errMap,
  mergeSources,
  pair,
  uniqObjects,
} from '@typeholes/tserr-common';
import e from 'express';

export const liveErrors = errMap([]);

export const __onUpdate = {
  fixed: (() => {}) as (keys: FlatErrKey[]) => void,
  changed: (() => {}) as (errors: typeof liveErrors) => void,
  new: (() => {}) as (errors: typeof liveErrors) => void,
};

export function setOnUpdate(handlers: Partial<typeof __onUpdate>) {
  Object.assign(__onUpdate, handlers);
}

let errId = 0;

function dedupErrors(errors: FlatErr[]): typeof liveErrors {
  const ret = errMap(errors, mergeSources);
  return ret;
}

export function updateErrors(
  errors: FlatErr[],
  scope: 'global' | { plugin: PluginName; file?: string },
) {
  const uniqErrors = dedupErrors(errors);
  console.log(errors);

  if (scope !== 'global') {
    const pluginName = scope.plugin as PluginName;
    if (
      Array.from(uniqErrors.values()).some((v) => {
        for (const key in v.sources) {
          if (key !== pluginName) {
            return true;
          }
          if (scope.file !== undefined) {
            const files = Object.keys(v.sources[pluginName]);
            if (files.length > 1 || files[0] !== scope.file) {
              return true;
            }
          }
        }
        return false;
      })
    ) {
      throw new Error('out of scope errors in update');
    }
  }

  const updatedIds: number[] = [];

  // this version of fixedKeys only works for global scope
  if (scope === 'global') {
    const fixedKeys = Array.from(liveErrors.keys()).filter(
      (k) => !uniqErrors.has(k),
    );
    if (fixedKeys && fixedKeys.length > 0) {
      fixedKeys.forEach((key) => liveErrors.delete(key));
      __onUpdate.fixed(fixedKeys);
    }
  }

  const { newKeys, updKeys } = splitBy(Array.from(uniqErrors.keys()), (k) =>
    !liveErrors.has(k) ? ['newKeys', k] : ['updKeys', k],
  );

  if (newKeys && newKeys.length > 0) {
    const newErrors = errMap([]);
    for (const key of newKeys) {
      const value = uniqErrors.get(key)!;
      newErrors.set(key, value);
      liveErrors.set(key, value);
    }
    __onUpdate.new(newErrors);
  }

  if (updKeys && updKeys.length > 0) {
    const updErrors = errMap([]);
    for (const key of updKeys) {
      const oldValue = liveErrors.get(key)!;
      const newValue = mergeSources(oldValue, uniqErrors.get(key)!);

      if (eq(oldValue, newValue)) {
        continue;
      }

      updErrors.set(key, newValue);
      liveErrors.set(key, newValue);
    }
    if (updErrors.size > 0) {
      __onUpdate.changed(updErrors);
    }
  }

  if (scope != 'global') {
    const fixedKeys: FlatErrKey[] = [];
    for (const [key, value] of liveErrors.rawEntries()) {
      // TODO
    }
  }
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