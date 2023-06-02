"use strict";
/*
type CheckStrict<T> = null extends undefined
  ? 'ERROR: tconfig.json needs strict: true'
  : T;
  */
const a = "really"; // No error
const b = "WRONG"; // Error: Type '"WRONG"' is not assignable to type 'Key'.
//# sourceMappingURL=opaque.js.map