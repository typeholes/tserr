import { computed, reactive } from 'vue';
import { Err, ErrDesc } from '../ErrDesc';
import { assertEq, shallowObjEq } from '../utilts';
import { State } from './state';

export const ErrState: State<
  'Err',
  [string, ...string[]],
  Err<ErrDesc<string>>
> = {
  stateName: 'Err',
  get: getErr,
  set: setErr,
  keys: computed(() => [...errors.keys()]),
} as const;

function getErr<T extends string>(
  name: T,
  ...values: string[]
): Err<ErrDesc<T>> | undefined {
  const key = errKey(name, values);

  const ret = errors.get(key);
  if (ret === undefined) {
    return undefined;
  }
  //  assertEq(ret.name, name);
  return ret as never /*Err<ErrDesc<typeof ret.name>>*/;
}

function setErr<T extends string>(err: Err<ErrDesc<T>>): boolean {
  const key = errKey(err.name, Object.values(err.values));
  const existing = getErr(key);
  if (existing) {
    return shallowObjEq(existing.values, err.values);
  }
  errors.set(key, err);
  return true;
}

const nameSep = String.fromCharCode(1);
const valueSep = String.fromCharCode(2);
function errKey(name: string, values: string[]) {
  if (values.length === 0) {
    return name;
  }
  return name + nameSep + values.join(valueSep);
}

const errors = reactive(new Map<string, Err<ErrDesc<string>>>());

export { errors as __private_errors };
