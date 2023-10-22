import { reactive } from 'vue';
import { ErrDesc } from './models/ErrDesc';
import { arrayEq, assertEq } from '../utilts';
import { State, mkState } from './state';

const map = reactive(new Map<string, ErrDesc>());
const name = 'ErrDesc';

export const ErrDescState: State<
  'ErrDesc',
  [string],
  ErrDesc<string>
> = mkState({
  name,
  map,
  toKey: (u) => u.name,
  get,
  set,
  remove,
});

function get<T extends string>(name: T): ErrDesc<T> | undefined {
  const ret = map.get(name);
  if (ret === undefined) {
    return undefined;
  }
  assertEq(ret.name, name);
  return ret as ErrDesc<typeof ret.name>;
}

function set<T extends string>(desc: ErrDesc<T>): boolean {
  const existing = get(desc.name);
  if (existing) {
    if (arrayEq(existing.keys, desc.keys)) {
      existing.template = desc.template;
      return true;
    }
    return false;
  }
  map.set(desc.name, desc);
  return true;
}

function remove<T extends string>(desc: ErrDesc<T>): boolean {
  return map.delete(desc.name);
}
