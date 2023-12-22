"use strict";
// @strict: true
// @exactOptionalPropertyTypes: true
function id(x) { return x; }
function f(a) {
    return a;
}
f(id({ a: undefined, z: undefined }));
function f2(a2) {
    return a2;
}
f2({ a: undefined });
// Argument of type '{ a: undefined; }' is not assignable to parameter of type 'A2' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
//   Types of property 'a' are incompatible.
//     Type 'undefined' is not assignable to type 'number'.(2379)
const z = { a: undefined };
const z2 = { a: undefined };
//# sourceMappingURL=simple.js.map