import { ErrDesc } from './models/ErrDesc';
import { mkState } from './state';

export const ErrDescState = mkState<'ErrDesc', ErrDesc<string>, [string] >('ErrDesc', (x: ErrDesc<string>) => [
  x.name,
]);
