export const oops: Omit<{ a: 1 }, 'a'> = 1;

type DeepExpand<T> = T extends T ? { [K in keyof T]: DeepExpand<T[K]> } : never;

type Oops = DeepExpand<typeof oops>;

const oops2: Oops = 1;

type First<A, B> = A;

type OK = First<string, typeof oops>;

function foo() : {}
 {
    return 1;
 }

function bar()
 {
    return [];
 }

 function baz() {
    return () => {};
 }

