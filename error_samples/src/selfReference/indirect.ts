export const selfed = f(2);

function f(x: number) {
   return selfed + x;
}

console.log({ selfed });
