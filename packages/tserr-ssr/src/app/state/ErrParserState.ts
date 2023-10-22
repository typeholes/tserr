import { reactive } from 'vue';
import { ErrParser, ErrDesc } from './models/ErrDesc';
import { assertEq } from '../utilts';
import { State, keySep, mkState } from './state';

const name = 'ErrParser';
const map = reactive(
  new Map<string, Map<string, ErrParser<ErrDesc<string>>>>(),
);

export const ErrParserState: State<
  'ErrParser',
  [string, string],
  ErrParser<ErrDesc<string>>
> = mkState({
  name,
  map: map as unknown as Map<string, ErrParser<ErrDesc<string>>>,
  toKey: (u) => `${u.name}${keySep}${u.source}`,
  get,
  set,
  remove,
});

function get<T extends string>(
  _name: T,
  _source: string | undefined,
): ErrParser<ErrDesc<T>> | undefined {
  const [name, source] =
    _source === undefined ? _name.split(keySep) : [_name, _source];
  const ret = map.get(name)?.get(source);
  if (!ret) {
    return undefined;
  }
  assertEq(ret.name, name);
  assertEq(ret.source, source);
  return ret as ErrParser<ErrDesc<typeof ret.name>> as never;
}

function set<T extends string>(parser: ErrParser<ErrDesc<T>>): boolean {
  const existing = get(parser.name, parser.source);
  if (existing) {
    return false;
  }

  if (!map.has(parser.name)) {
    map.set(parser.name, new Map());
  }

  map.get(parser.name)!.set(parser.source, parser);
  return true;
}

function remove<T extends string>(parser: ErrParser<ErrDesc<T>>): boolean {
  const existing = get(parser.name, parser.source);
  if (!existing) {
    return false;
  }

  return map.get(parser.name)?.delete(parser.source) ?? false;
}
