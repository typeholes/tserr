import { computed, reactive } from 'vue';
import { ErrParser, ErrDesc } from '../ErrDesc';
import { assertEq } from '../utilts';
import { State } from './state';

export const ErrParserState: State<
  'ErrParser',
  [string, string],
  ErrParser<ErrDesc<string>>
> = {
  stateName: 'ErrParser',
  get: getErrParser,
  set: setErrParser,
  keys: computed(() => [...parsers.keys()]),
} as const;

function getErrParser<T extends string>(
  name: T,
  source: string,
): ErrParser<ErrDesc<T>> | undefined {
  const ret = parsers.get(name)?.get(source);
  if (!ret) {
    return undefined;
  }
  assertEq(ret.name, name);
  assertEq(ret.source, source);
  return ret as ErrParser<ErrDesc<typeof ret.name>>;
}

function setErrParser<T extends string>(
  parser: ErrParser<ErrDesc<T>>,
): boolean {
  const existing = getErrParser(parser.name, parser.source);
  if (existing) {
    return false;
  }

  if (!parsers.has(parser.name)) {
    parsers.set(parser.name, new Map());
  }

  parsers.get(parser.name)!.set(parser.source, parser);
  return true;
}

const parsers = reactive(
  new Map<string, Map<string, ErrParser<ErrDesc<string>>>>(),
);
