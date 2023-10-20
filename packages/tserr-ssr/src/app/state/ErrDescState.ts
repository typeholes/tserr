import { computed, reactive } from 'vue';
import { ErrDesc } from '../ErrDesc';
import { arrayEq, assertEq } from '../utilts';
import { State } from './state';

export const ErrDescState: State<'ErrDesc', [string], ErrDesc<string>> = {
  stateName: 'ErrDesc',
  get: getErrDesc,
  set: setErrDesc,
  keys: computed(() => [...descriptions.keys()]),
} as const;

function getErrDesc<T extends string>(name: T): ErrDesc<T> | undefined {
  const ret = descriptions.get(name);
  if (ret === undefined) {
    return undefined;
  }
  assertEq(ret.name, name);
  return ret as ErrDesc<typeof ret.name>;
}

function setErrDesc<T extends string>(desc: ErrDesc<T>): boolean {
  const existing = getErrDesc(desc.name);
  if (existing) {
    if (arrayEq(existing.keys, desc.keys)) {
      existing.template = desc.template;
      return true;
    }
    return false;
  }
  descriptions.set(desc.name, desc);
  return true;
}

const descriptions = reactive(new Map<string, ErrDesc>());
