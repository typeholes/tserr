"use strict";
/*
type CheckStrict<T> = null extends undefined
  ? 'ERROR: tconfig.json needs strict: true'
  : T;
  */
//prettier-ignore
const inlineB = 'WRONG';
const opaqueA = 'unioned1'; // No error
const opaqueB = 'WRONG'; // Error: Type '"WRONG"' is not assignable to type 'Key'.
const a = 'unioned1'; // No error
const b = 'WRONG'; // Error: Type '"WRONG"' is not assignable to type 'Key'.
//# sourceMappingURL=opaque.js.map