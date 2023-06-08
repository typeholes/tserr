const t: { a: 1 } = { a: 1, b: 2 };

// not an excess property check so the fix should not show
const n: number = 's';

function over(o: { a: { oops: { c: 2 } } }): number;
function over(o: { b: 2 }): number;
function over(o: { a?: { oops: { c: 2 } } } | { b?: 2 }) {
  return 1;
}

over({ a: { oops: { c: 2 } }, c: 2 });

over({ a: { oops: { c: 2, d: 2 } }, d: 2 });

type Deep = {
  a: {
    b: {
      c: {
        d: 1;
      };
    };
  };
};
type Deep2 = Deep & { 2: 2 };

const deep: Deep = { a: { b: { c: { d: 1, e: 2 } } } };
//const deep: Deep = { a: { b: { c: { d: 1, e: 2 } } } };

function overDeep(deep: Deep2): number;
function overDeep(deep: Deep): number;
function overDeep(deep: Deep | Deep2): number {
  return 1;
}

overDeep({ z: 2, a: { b: { c: { d: 1 } } } });
