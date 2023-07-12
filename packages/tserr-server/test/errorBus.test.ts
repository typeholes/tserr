import { addFile, fileErrors } from '../src/lib/errorBus';
import { FlatErr, PluginName, pair } from '@typeholes/tserr-common';

const plugin1 = PluginName('p1');
const plugin2 = PluginName('p2');

const err1: FlatErr = {
  span: { start: { line: 1, char: 3 }, end: { line: 1, char: 10 } },
  parsed: [[0, 0, { type: 'unknownError', parts: [''] }]],
  sources: {[plugin1]: [pair('123', ['abc'])]},
};

describe('a single file can be added', () => {
  it('should add a file', () => {
    const files = addFile('file1');
    expect(fileErrors).toHaveProperty('file1');
  });

  it('should add an error', () => {
    const files = addFile('file1')!;
    for (let i = 0; i < 3; i++) {
      files.updateErrors(plugin1, [err1]);
      expect(files.getState().errors).toHaveLength(1);
      expect(files.getState().fixed).toHaveLength(0);
    }
  });
});


