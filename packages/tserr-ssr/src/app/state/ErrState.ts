import { reactive } from 'vue';
import { Err, ErrDesc } from './models/ErrDesc';
import { shallowObjEq } from '../utilts';
import { State, mkState } from './state';

const name = 'Err';
const map = reactive(new Map<string, Err<ErrDesc<string>>>());

export const ErrState: State<
  'Err',
  [string, ...string[]],
  Err<ErrDesc<string>>
> = mkState({ name, map, toKey, get, set, remove });

function get<T extends string>(
  name: T,
  ...values: string[]
): Err<ErrDesc<T>> | undefined {
  const key = errKey(name, values);

  const ret = map.get(key);
  if (ret === undefined) {
    return undefined;
  }
  //  assertEq(ret.name, name);
  return ret as never /*Err<ErrDesc<typeof ret.name>>*/;
}

function set<T extends string>(err: Err<ErrDesc<T>>): boolean {
  const key = errKey(err.name, Object.values(err.values));
  const existing = get(key);
  if (existing) {
    return shallowObjEq(existing.values, err.values);
  }
  map.set(key, err);
  return true;
}

function remove<T extends string>(err: Err<ErrDesc<T>>): boolean {
  const key = toKey(err);
  return map.delete(key);
}

const nameSep = String.fromCharCode(1);
const valueSep = String.fromCharCode(2);
function errKey(name: string, values: string[]) {
  if (values.length === 0) {
    return name;
  }
  return name + nameSep + values.join(valueSep);
}

function toKey(u: Err<ErrDesc<string>>): string {
  return errKey(u.name, Object.values(u.values));
}

export { map as __private_errors };
