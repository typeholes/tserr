import { arrayOf, scope, type } from 'arktype'
import { arkSplitter } from './arkUtil'

const _resolvedError = scope({
  aliasSelfReferenceResult: [
    'number',
    'number',
    {
      type: "'aliasSelfReference'",
      from: 'string'
      // path: type(['string', 'string'])
    }
  ],
  unknownError: [
    'number',
    'number',
    {
      type: "'unknownError'",
      parts: 'string[]'
    }
  ]
  // unparsable: {0
  //     type: 'string'
  // }
})
export const resolvedError = _resolvedError.compile()
const unionedResolvedError = _resolvedError.type('aliasSelfReferenceResult|unknownError')
export type ResolvedError = typeof unionedResolvedError.infer

export type AliasSelfReferenceResult = typeof resolvedError.aliasSelfReferenceResult.infer

export const splitResolvedErrors = arkSplitter(resolvedError)
export type SplitResolvedErrors = ReturnType<typeof splitResolvedErrors>

export const err = scope({
  err: {
    line: 'number',
    start: 'number',
    lines: 'string[]',
    parsed: arrayOf([type('number'), type('number'), type('unknown')])
  }
}).compile()

export const splitErr = arkSplitter(err)
export type SplitErr = ReturnType<typeof splitErr>

export function deserialize(x: unknown[]) {
  const errs = splitErr(x).err
  const ret = errs.map((e) => ({
    ...e,
    parsed: splitResolvedErrors(e.parsed, 'first')
  }))
  return ret
}

const example = [
  {
    line: 10,
    start: 343,
    lines: ["Type alias 'RangeNode' circularly references itself."],
    parsed: [
      [
        0,
        {
          type: 'aliasSelfReference',
          from: 'RangeNode'
        }
      ]
    ],
    children: []
  },
  {
    line: 15,
    start: 446,
    lines: ["'l' is referenced directly or indirectly in its own type annotation."],
    parsed: [
      [
        0,
        {
          type: 'unknownError',
          parts: ['', 'l', 'is referenced directly or indirectly in its own type annotation.']
        }
      ]
    ],
    children: []
  },
  {
    line: 21,
    start: 515,
    lines: [
      "'RangeNode' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer."
    ],
    parsed: [
      [
        0,
        {
          type: 'selfReference',
          from: 'RangeNode'
        }
      ]
    ],
    children: []
  }
]
