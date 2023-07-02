import { scope, } from 'arktype';
import { makeArkComponent } from './arkVue';

export const _supplement = scope({
  overloadPiece: {
    type: "'overloadPiece'",
    idx: 'number',
    length: 'number',
    signature: 'string',
    functionName: 'string',
  },
  text: 'string',
});

export const supplement = _supplement.compile();

export default makeArkComponent(supplement);
