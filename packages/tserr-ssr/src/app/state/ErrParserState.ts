import { reactive } from 'vue';
import { ErrParser, ErrDesc } from '../ErrDesc';
import { assertEq } from '../utilts';
import { State, mkState } from './state';

const parsers = reactive(
  new Map<string, Map<string, ErrParser<ErrDesc<string>>>>(),
);

export const ErrParserState: State<
  'ErrParser',
  [string, string],
  ErrParser<ErrDesc<string>>
> = mkState(
  'ErrParser',
  parsers as unknown as Map<string, ErrParser<ErrDesc<string>>>,
  getErrParser,
  setErrParser,
);

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
