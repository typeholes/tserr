const t: { a: 1 } = { a: 1, b: 2 };

// not an excess property check so the fix should not show
const n: number = 's';

function over(o: { a: 1 }): number;
function over(o: { b: 2 }): number;
function over(o: { a?: 1; b?: 2 }) {
  return 1;
}

over({a:1, c: 2})
