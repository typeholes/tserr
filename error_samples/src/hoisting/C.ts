import { B } from './B';
import { A } from './A';

console.log('Module C', A, B);

export class C {
  constructor() {
    // this may run later, after all three modules are evaluated, or
    // possibly never.
    console.log(A);
    console.log(B);
  }
}

// export {C as default} // export!
