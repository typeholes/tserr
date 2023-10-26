import { mkState } from './state';
import { ErrLocation } from './models/ErrDesc';

export const ErrLocationState = mkState('ErrLocation', (u: ErrLocation) => [
    u.fileName,
    u.span.start.line,
    u.span.start.char,
    u.span.end.line,
    u.span.end.line,
]);
