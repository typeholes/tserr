import { ErrDescState } from './ErrDescState';
import { ErrParserState } from './ErrParserState';
import { ErrState } from './ErrState';

ErrDescState.set({
  name: 'foo',
  keys: ['bar'],
  template: `
<div> bar: {{ err.values.bar }} </div>
`,
});

ErrState.set({
  name: 'foo',
  values: { bar: '1' },
});

ErrParserState.set({ name: 'foo', source: 'dummy', parse: (text) => [text] });

export const dummy = 1;
