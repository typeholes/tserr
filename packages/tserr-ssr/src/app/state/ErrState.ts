import { Err, ErrDesc } from './models/ErrDesc';
import { mkState } from './state';

export const ErrState = mkState('Err', (x: Err<ErrDesc<string>>) => [
  x.name,
  ...Object.keys(x.values),
]);
