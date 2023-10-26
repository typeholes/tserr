import { parseErrorMessage } from '../parse';
import { states } from './states';

export function initDummyStates() {
  states.ErrDesc.add({
    name: 'foo',
    keys: ['bar'],
    template: `
<div> bar: {{ err.values.bar }} </div>
`,
  });

  states.Err.add({
    name: 'foo',
    values: { bar: '1' },
  });

  states.ErrParser.add({
    name: 'foo',
    source: 'dummy',
    parse: (text) => [text],
  });

  // setTimeout(() => {
  setInterval(() => {
    states.Err.add({ name: 'foo', values: { bar: '4' } });
    parseErrorMessage("'dummy' expected.");
  }, 5000);
}
