import { states } from './states';

export function initDummyStates() {
  states.ErrDesc.set({
    name: 'foo',
    keys: ['bar'],
    template: `
<div> bar: {{ err.values.bar }} </div>
`,
  });

  states.Err.set({
    name: 'foo',
    values: { bar: '1' },
  });

  states.ErrParser.set({
    name: 'foo',
    source: 'dummy',
    parse: (text) => [text],
  });
}
