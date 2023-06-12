import { scope } from 'arktype';

export const errorTypes = scope({
  unknownError: {
    type: "'unknownError'",
    parts: 'string[]',
  },
  notAssignable: {
    type: "'notAssignable'",
    from: 'string',
    to: 'string',
  },
  selfReference: {
    type: "'selfReference'",
    from: 'string',
  },
  aliasSelfReference: {
    type: "'aliasSelfReference'",
    from: 'string',
  },
  excessProperty: {
    type: "'excessProperty'",
    key: 'string',
    to: 'string',
  },
  overloadPiece: {
    type: "'overloadPiece'",
    idx: 'number',
    length: 'number',
    signature: 'string',
  },
  parsedError:
    'unknownError|notAssignable|selfReference|aliasSelfReference|excessProperty|overloadPiece',
}).compile();

export type ParsedError = typeof errorTypes.parsedError.infer;
