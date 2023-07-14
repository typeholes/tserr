import { eq, uniqObjects } from '@typeholes/tserr-common';

describe('merge', () => {
  it('merges object arrays', () => {
    const a1 = { a: 1 };
    const a2 = { a: 2 };
    const b1 = { b: 1 };
    const b2 = { b: 2 };
    expect(eq(uniqObjects([a1], [a1]), [a1])).toBeTruthy();
    expect(uniqObjects([a1], [a1]).length).toBe(1);
    expect(eq(uniqObjects([a1], [a2]), [a1, a2])).toBeTruthy();
  });
});

describe('eq', () => {
  it('simple values', () => {
    expect(eq(1, 1)).toBeTruthy();
    expect(eq(1, 2)).toBeFalsy();
    expect(eq('a', 'a')).toBeTruthy();
    expect(eq('b', 'ba')).toBeFalsy();
  });

  it('arrays', () => {
    expect(eq([1], [1])).toBeTruthy();
    expect(eq([1], [2])).toBeFalsy();
    expect(eq([1], [1, 2])).toBeFalsy();
    expect(eq([1, 2], [1])).toBeFalsy();
    expect(eq([1, 2], [1, 2])).toBeTruthy();

    expect(eq([1, [2]], [1, [2]])).toBeTruthy();
    expect(eq([1, [2]], [1, [3]])).toBeFalsy();
  });

  it('objects', () => {
    expect(eq({ a: 1 }, { a: 1 })).toBeTruthy();
    expect(eq({ a: 1 }, { a: 2 })).toBeFalsy();
    expect(eq({ a: 1 }, { a: 1, b: 1 })).toBeTruthy();

    //@ts-expect-error
    expect(eq({ a: 1, b: 1 }, { a: 1 })).toBeFalsy();
  });
});
