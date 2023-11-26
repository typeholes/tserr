"use strict";
const t = { a: 1, b: 2 };
// not an excess property check so the fix should not show
const n = 's';
function over(o) {
    return 1;
}
over({ a: { oops: { c: 2 } }, c: 2 });
over({ a: { oops: { c: 2, d: 2 } }, d: 2 });
const deep = { a: { b: { c: { d: 1, e: 2 } } } };
function overDeep(deep) {
    return 1;
}
overDeep({ z: 2, a: { b: { c: { d: 1 } } } });
//
//# sourceMappingURL=excessProperty.js.map