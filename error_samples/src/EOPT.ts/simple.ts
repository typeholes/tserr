// @strict: true
// @exactOptionalPropertyTypes: true

function id(x: any) { return x}

type A = { a?: number; b: string; z?:  {} };

function f(a: A) {
  return a;
}

f(id({ a: undefined, z: undefined }));


type A2 = { a?: number };

function f2(a2: A2) {
  return a2;
}

f2({ a: undefined });

// Argument of type '{ a: undefined; }' is not assignable to parameter of type 'A2' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
//   Types of property 'a' are incompatible.
//     Type 'undefined' is not assignable to type 'number'.(2379)

const z: A = { a: undefined };
const z2: A2 = { a: undefined };

