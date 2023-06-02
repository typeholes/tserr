

/*
type CheckStrict<T> = null extends undefined
  ? 'ERROR: tconfig.json needs strict: true'
  : T;
  */


  type Opaque<T> = T extends any ? T : never;

type Key = Opaque<"really" | "huge" | "ass" | "union" | "I" | "don't" | "want" | "to" | "show" | "up" | "in" | "type" | "error" | "messages">;

const a: Key = "really"; // No error
const b: Key = "WRONG"; // Error: Type '"WRONG"' is not assignable to type 'Key'.


