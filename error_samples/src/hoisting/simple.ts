

export const x = undefined ?? foo();

function foo() : number {
  return x;
}
