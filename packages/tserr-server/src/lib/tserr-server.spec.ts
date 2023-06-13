import { tserrServer } from './tserr-server';

describe('tserrServer', () => {
  it('should work', () => {
    expect(tserrServer()).toEqual('tserr-server');
  });
});
