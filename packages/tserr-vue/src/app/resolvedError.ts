import { arrayOf, scope, } from 'arktype';
import { arkSplitter } from './arkUtil';

const _resolvedError = scope({
  notAssignable: [
    'number',
    'number',
    {
      type: "'notAssignable'",
      to: 'string',
      from: 'string',
      // path: type(['string', 'string'])
    },
  ],
  aliasSelfReferenceResult: [
    'number',
    'number',
    {
      type: "'aliasSelfReference'",
      from: 'string',
      // path: type(['string', 'string'])
    },
  ],
  excessProperty: [
    'number',
    'number',
    {
      type: "'excessProperty'",
      key: 'string',
      to: 'string',
    },
  ],
  unknownError: [
    'number',
    'number',
    {
      type: "'unknownError'",
      parts: 'string[]',
    },
  ],
  // unparsable: {0
  //     type: 'string'
  // }
});
export const resolvedError = _resolvedError.compile();
export const unionedResolvedError = _resolvedError.type(
  'aliasSelfReferenceResult|unknownError|notAssignable|excessProperty'
);
export type ResolvedError = typeof unionedResolvedError.infer;

export type AliasSelfReferenceResult =
  typeof resolvedError.aliasSelfReferenceResult.infer;

export const splitResolvedErrors = arkSplitter(resolvedError);
export type SplitResolvedErrors = ReturnType<typeof splitResolvedErrors>;

export const flatErr = scope({
  err: {
    line: 'number',
    endLine: 'number',
    start: 'number',
    lines: 'string[]',
    parsed: arrayOf(unionedResolvedError)
  },
}).compile();
export type FlatErr = typeof flatErr.err.infer;



