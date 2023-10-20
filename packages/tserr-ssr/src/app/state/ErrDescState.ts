import { reactive } from 'vue';
import { ErrDesc } from '../ErrDesc';
import { arrayEq, assertEq } from '../utilts';
import { State, mkState } from './state';

const descriptions = reactive(new Map<string, ErrDesc>());

export const ErrDescState: State<
  'ErrDesc',
  [string],
  ErrDesc<string>
> = mkState('ErrDesc', descriptions, getErrDesc, setErrDesc);

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
