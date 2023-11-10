import { Err, ErrDesc, ErrLocation, type Schema, _mkSchema } from '../src/lib/schema/schema';

let schema : Schema;
// beforeAll( async () => {
// const foo = await import('../src/lib/schema/schema');
//  remote = foo.schema;
// })

beforeEach(() => {
  schema = _mkSchema();
});

describe('schema', () => {
  it('get return undefined when not present', () => {
    const desc: ErrDesc = { name: 'test', keys: ['a'] };
    const gotten = schema.ErrDesc.get(desc);
    expect(gotten).toBeUndefined();
  });
  it('adds and gets', () => {
    const desc: ErrDesc = { name: 'test', keys: ['a'] };
    schema.ErrDesc.add(desc);
    const gotten = schema.ErrDesc.get(desc);
    expect(gotten).toEqual(desc);
  });
  it('clones', () => {
    const desc: ErrDesc = { name: 'test', keys: ['a'] };
    schema.ErrDesc.add(desc);
    desc.template = 'the template';
    const gotten = schema.ErrDesc.get(desc);
    expect(gotten).not.toEqual(desc);
  });
  it('updates', () => {
    const desc: ErrDesc = { name: 'test', keys: ['a'] };
    schema.ErrDesc.add(desc);
    desc.template = 'the template';
    schema.ErrDesc.add(desc);
    const gotten = schema.ErrDesc.get(desc);
    expect(gotten).not.toEqual(desc);

    schema.ErrDesc.merge = (a, b) => b;
    schema.ErrDesc.add(desc);
    const gotten2 = schema.ErrDesc.get(desc);
    expect(gotten2).toEqual(desc);
  });
  it('triggers mutation', () => {
    let target: {
      action?: string | undefined;
      existing?: ErrDesc | undefined;
      merged?: ErrDesc<string> | undefined;
    } = {};
    schema.ErrDesc.onMutate.push((action, _arg, existing, merged) => {
      Object.assign(target, { action, existing, merged });
    });
    const desc: ErrDesc = { name: 'test', keys: ['a'] };
    const originalDesc = { ...desc };
    schema.ErrDesc.add(desc);
    expect(target.action).toEqual('add');
    expect(target.existing).toEqual(undefined);
    expect(target.merged).toEqual(desc);

    desc.template = 'the template';
    schema.ErrDesc.merge = (a, b) => b;
    schema.ErrDesc.add(desc);
    expect(target.action).toEqual('add');
    expect(target.existing).toEqual(originalDesc);
    expect(target.merged).toEqual(desc);
    const gotten = schema.ErrDesc.get(desc);
    expect(gotten).toEqual(desc);
  });

  it('relates', () => {
    const desc: ErrDesc<'test'> = { name: 'test', keys: ['a'] };
    const err: Err<ErrDesc<'test'>> = { name: 'test', values: { a: 'some a' } };
    const loc: ErrLocation = {
      fileName: 'dummy.ts',
      span: { start: { line: 1, char: 2 }, end: { line: 3, char: 4 } },
    };
    schema.ErrDesc.add(desc);
    schema.Err.add(err);
    schema.ErrLocation.add(loc);
    schema.ErrLocation.$.At.Err.add([loc, err]);
    const at = schema.ErrLocation.$.At.Err(loc);
    expect(at).toEqual([err]);
  });

  it('relations trigger mutation', () => {
    let target: {
      action?: string | undefined;
      existing?: ErrDesc | undefined;
      merged?: ErrDesc<string> | undefined;
    } = {};
    schema.ErrLocation.$.At.Err.onMutate.push(
      (action, _arg, existing, merged) => {
        Object.assign(target, { action, existing, merged });
      },
    );
    const desc: ErrDesc = { name: 'test', keys: ['a'] };
    const originalDesc = { ...desc };
    const err: Err<ErrDesc<'test'>> = { name: 'test', values: { a: 'some a' } };
    const loc: ErrLocation = {
      fileName: 'dummy.ts',
      span: { start: { line: 1, char: 2 }, end: { line: 3, char: 4 } },
    };

    schema.ErrDesc.add(desc);
    schema.Err.add(err);
    schema.ErrLocation.add(loc);
    schema.ErrLocation.$.At.Err.add([loc, err]);

    expect(target.action).toEqual('add');
    expect(target.existing).toEqual(undefined);
    expect(target.merged).toEqual([loc,err]);

  });
});

