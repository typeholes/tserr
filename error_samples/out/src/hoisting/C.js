"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.C = void 0;
const B_1 = require("./B");
const A_1 = require("./A");
console.log('Module C', A_1.A, B_1.B);
class C {
    constructor() {
        // this may run later, after all three modules are evaluated, or
        // possibly never.
        console.log(A_1.A);
        console.log(B_1.B);
    }
}
exports.C = C;
// export {C as default} // export!
//# sourceMappingURL=C.js.map