/*eslint-env es6*/


// B.ts
console.log('Module B', C);
var B = class extends C {
  // ...
};

// C.ts
console.log('Module C', A, B);
var C = class {
  constructor() {
    console.log(A);
    console.log(B);
  }
};

// A.ts
console.log('Module A', C);
var A = class extends C {
  // ...
};

// main.ts
console.log('Entrypoint', A);
