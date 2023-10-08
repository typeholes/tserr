import { arrayOf, scope, narrow, Type, type, Problems } from 'arktype';
import { arkSplitter } from './arkUtil';

const _resolvedError = scope({
  notAssignable: {
    type: "'notAssignable'",
    to: 'string',
    from: 'string',
    // path: type(['string', 'string'])
  },
  aliasSelfReferenceResult: {
    type: "'aliasSelfReference'",
    from: 'string',
    // path: type(['string', 'string'])
  },
  excessProperty: {
    type: "'excessProperty'",
    key: 'string',
    to: 'string',
  },
  unknownError: {
    type: "'unknownError'",
    parts: 'string[]',
  },
  // unparsable: {0
  //     type: 'string'
  // }
});
export const resolvedError = _resolvedError.compile();
export const unionedResolvedError = _resolvedError.type(
  'aliasSelfReferenceResult|unknownError|notAssignable|excessProperty',
);
export type ResolvedError = typeof unionedResolvedError.infer;

export type AliasSelfReferenceResult =
  typeof resolvedError.aliasSelfReferenceResult.infer;

export const splitResolvedErrors = arkSplitter(resolvedError);
export type SplitResolvedErrors = ReturnType<typeof splitResolvedErrors>;

export const flatErr = scope({
  err: {
    errId: 'number',
    parsed: arrayOf({ depth: 'number', value: unionedResolvedError }),
    sources: PartialRecord(
      type('string'),
      arrayOf(
        type({
          code: 'string',
          raw: 'string[]',
          span: {
            fileName: 'string',
            start: { line: 'number', char: 'number' },
            end: { line: 'number', char: 'number' },
            src: 'string|undefined',
          },
        }),
      ),
    ),
  },
}).compile();
export type FlatErr = typeof flatErr.err.infer;

function PartialRecord<K extends string | number, V>(
  keyType: Type<K>,
  valueType: Type<V>,
): Type<Record<K, V>> {
  return narrow(type('object'), (data, ctx): data is Record<K, V> => {
    const problems = ctx as any as Problems;
    if ((keyType as any as Type<never>).includesMorph) {
      problems.mustBe('without morph', { path: ['__keyType__'] });
      return false;
    }
    return Object.entries(data).every(([k, v]) => {
      const keyCheck = keyType(k);
      if (keyCheck.problems) {
        problems.addProblem(keyCheck.problems[0] as any);
        return false;
      }
      const valueCheck = valueType(v);
      if (valueCheck.problems) {
        problems.addProblem(valueCheck.problems[0] as any);
        return false;
      }
      if (valueCheck.data !== v) (data as any)[k] = valueCheck.data;
      return true;
    });
  }) as any;
}
