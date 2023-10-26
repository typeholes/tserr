import { ErrParser, ErrDesc } from './models/ErrDesc';
import { mkState } from './state';

export const ErrParserState = mkState(
  'ErrParser',
  (x: ErrParser<ErrDesc<string>>) => [x.source, x.name],
);
