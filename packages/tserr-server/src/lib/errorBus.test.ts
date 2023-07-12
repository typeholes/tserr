import { addFile, fileErrors } from './errorBus'
import { FlatErr, PluginName } from '@typeholes/tserr-common';

describe('a single file can be added', () => {
  it('should blah', () => {
  const files = addFile('file1');
  expect(fileErrors).toHaveProperty('file1');
  })
});
