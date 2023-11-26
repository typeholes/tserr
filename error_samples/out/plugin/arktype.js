"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const arktype_1 = require("arktype");
const { form } = (0, arktype_1.scope)({
    form: {
        name: "string",
        password: "string",
        confirmPassword: "password"
    },
}).compile();
//# sourceMappingURL=arktype.js.map