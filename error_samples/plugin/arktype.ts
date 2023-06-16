import { scope } from 'arktype';

const { form } = scope({
    form: {
        name: "string",
        password: "string",
        confirmPassword: "password"
    },
}).compile();


