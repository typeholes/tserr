import { mkSimpleState, keySep } from './state';
import { ErrLocation } from './models/ErrDesc';

export const ErrLocationState = mkSimpleState(
  'ErrLocation',
  (u: ErrLocation) =>
    `${u.fileName}${keySep}${u.span.start.line}${keySep}${u.span.start.char}${keySep}${u.span.end.line}${keySep}${u.span.end.line}`,
);
