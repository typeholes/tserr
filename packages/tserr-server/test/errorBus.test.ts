import {
  updateErrors,
  liveErrors,
  __onUpdate,
  setOnUpdate,
} from '../src/lib/errorBus';
import { FlatErr, PluginName, mergeSources } from '@typeholes/tserr-common';

const plugin1 = PluginName('p1');
const plugin2 = PluginName('p2');

beforeEach(() => {
  liveErrors.clear();
  setOnUpdate({
    new: jest.fn(),
    changed: jest.fn(),
    fixed: jest.fn(),
  });
});

const err1 = (pluginName = plugin1, endLind = 1) =>
  ({
    parsed: [{ depth: 0, value: { type: 'unknownError', parts: [''] } }],
    sources: {
      [pluginName]: { file1: [
        {
          code: '123',
          raw: ['abc'],
          span: {
            start: { line: 1, char: 3 },
            end: { line: endLind, char: 10 },
          },
        },
      ],
    },
  }
  }) satisfies FlatErr;

const err2 = () => {
  const e = err1();
  e.parsed[0].value.parts.push('different');
  return e;
};


describe( 'mergeSources', () => {
  it( 'should merge', () => {
    const merged = mergeSources(err1(plugin1), err1(plugin1, 10));
    expect(merged.sources[plugin1]['file1'].length).toBe(2);
  });
});

// prettier-ignore
for ( const scope of [
  'global',
 { plugin: plugin1},
 { plugin: plugin1, file: 'file1' },
] as const) {
  const type =JSON.stringify(scope);

describe(`liveErrors (simple) - ${type}`, () => {
  it(`should add errors -${type}`, () => {
    for (let i = 0; i < 3; i++) {
      updateErrors([err1()], scope);
      expect(liveErrors.size).toBe(1);
    }
    expect(__onUpdate.new).toBeCalledTimes(1);

    for (let i = 0; i < 3; i++) {
      updateErrors([err1(), err2()], scope);
      expect(liveErrors.size).toBe(2);
    }
    expect(__onUpdate.new).toBeCalledTimes(2);

    updateErrors([err1(), err2()], scope);
    expect(liveErrors.size).toBe(2);
    expect(__onUpdate.new).toBeCalledTimes(2);
  });

  it(`should change errors - ${type}`, () => {
    updateErrors([err1()], scope);

    updateErrors([err1(plugin1, 10)], scope);
    expect(liveErrors.size).toBe(1);

    expect(__onUpdate.new).toBeCalledTimes(1);
    expect(__onUpdate.changed).toBeCalledTimes(1);
    expect(__onUpdate.fixed).toBeCalledTimes(0);

    expect(liveErrors.values().next().value.sources).toHaveProperty(plugin1);
  });

  it(`should handle fixed errors - ${type}`, () => {
    updateErrors([err1(), err2()], scope);
    expect(liveErrors.size).toBe(2)
    expect(__onUpdate.new).toBeCalledTimes(1);
    expect(__onUpdate.changed).toBeCalledTimes(0);

    updateErrors([err2()], scope);

    expect(liveErrors.size).toBe(1)
    expect(__onUpdate.new).toBeCalledTimes(1);
    expect(__onUpdate.changed).toBeCalledTimes(0);
    expect(__onUpdate.fixed).toBeCalledTimes(1);

    updateErrors([], scope);

    expect(liveErrors.size).toBe(0);
    expect(__onUpdate.new).toBeCalledTimes(1);
    expect(__onUpdate.changed).toBeCalledTimes(0);
    expect(__onUpdate.fixed).toBeCalledTimes(2);

  });
});
}


/*
for (const scope of [
  { plugin: plugin1 },
  { plugin: plugin1, file: 'file1' },
]) {
  const type = JSON.stringify(scope);

  describe(`liveErrors (2 plugins) - ${type}`, () => {
    it(`should add errors -${type}`, () => {
        updateErrors([err1()], 'global');
        expect(liveErrors).toHaveLength(1);
      expect(__onError.new).toBeCalledTimes(1);

      for (let i = 0; i < 3; i++) {
        updateErrors([err1(), err2()], 'global');
        expect(liveErrors).toHaveLength(2);
      }
      expect(__onError.new).toBeCalledTimes(2);

      updateErrors([err1(), err2()], 'global');
      expect(liveErrors).toHaveLength(2);
      expect(__onError.new).toBeCalledTimes(2);
    });

    it(`should change errors - ${type}`, () => {
      updateErrors([err1()], 'global');

      updateErrors([err1(plugin2)], 'global');
      expect(liveErrors).toHaveLength(1);

      expect(__onError.new).toBeCalledTimes(1);
      expect(__onError.changed).toBeCalledTimes(1);
      expect(__onError.fixed).toBeCalledTimes(0);

      expect(liveErrors[0].sources).toHaveProperty(plugin1);
      expect(liveErrors[0].sources).toHaveProperty(plugin2);
    });

    it(`should handle fixed errors - ${type}`, () => {
      updateErrors([err1(), err2()], 'global');
      updateErrors([err2()], 'global');

      expect(liveErrors).toHaveLength(1);
      expect(__onError.new).toBeCalledTimes(1);
      expect(__onError.changed).toBeCalledTimes(0);
      expect(__onError.fixed).toBeCalledTimes(1);

      updateErrors([], 'global');

      expect(liveErrors).toHaveLength(0);
      expect(__onError.new).toBeCalledTimes(1);
      expect(__onError.changed).toBeCalledTimes(0);
      expect(__onError.fixed).toBeCalledTimes(2);
    });
  });
}

*/
