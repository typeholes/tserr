function overloaded(a: string): string;
function overloaded(n: number): number;
function overloaded(x: string | number): string | number {
   return x;
}

const obj = { a: 1 };
overloaded(obj);
