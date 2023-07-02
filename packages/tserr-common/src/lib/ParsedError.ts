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

export function parseError(err: string): ParsedError {

  const parts: string[] = [''];

  let i = 0;
  let state: 'raw' | 'quote' | 'double' = 'raw';
  err.split('').forEach((c) => {
    if (c === undefined) {
      return;
    }
    if (state === 'raw') {
      if (c === "'") {
        state = 'quote';
        i++;
        parts[i] = '';
      } else {
        parts[i] += c;
      }
    } else if (state === 'quote') {
      if (c === '"') {
        state = 'double';
        parts[i] += c;
      } else if (c === "'") {
        state = 'raw';
        parts[++i] = '';
      } else {
        parts[i] += c;
      }
    } else if (state === 'double') {
      if (c === '"') {
        state = 'quote';
      }
      parts[i] += c;
    }
  });

  for (let i = 0; i < parts.length; i++) {
    parts[i] = parts[i].trim();
  }

  if (parts[parts.length - 1] === '.') {
    parts.length--;
  }

  if (
    (parts.length === 4 &&
      parts[0] === 'Type' &&
      parts[2] === 'is not assignable to type') ||
    parts[2] === 'is not assignable to parameter of type'
  ) {
    return {
      type: 'notAssignable',
      from: parts[1],
      to: parts[3],
    };
  } else if (
    parts.length === 4 &&
    parts[2] === 'implicitly has type' &&
    parts[4] ===
      'because it does not have a type annotation and is referenced directly or indirectly in its own initializer.'
  ) {
    return {
      type: 'selfReference',
      from: parts[1],
    };
  } else if (
    parts.length === 3 &&
    parts[0] === 'Type alias' &&
    parts[2] === 'circularly references itself.'
  ) {
    return {
      type: 'aliasSelfReference',
      from: parts[1],
    };
  } else if (parts.length === 3 && parts[0].startsWith('Overload ')) {
    const overloadParts = parts[0].split(' ');
    const idx = Number.parseInt(overloadParts[1]) ?? -1;
    const length = Number.parseInt(overloadParts[3]) ?? -1;
    return { type: 'overloadPiece', idx, length, signature: parts[1] };
  } else if (
    parts.length === 4 &&
    parts[0] === 'Object literal may only specify known properties, and'
  ) {
    return {
      type: 'excessProperty',
      key: parts[1],
      to: parts[3],
    };
  } else {
    return {
      type: 'unknownError',
      parts,
    };
  }
}
