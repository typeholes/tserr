type ignore_TSC1234 = any;
type ignore_TSC2322 = any;

const no_error: number = 1 as ignore_TSC1234;

const should_mismatch: string = 1 as ignore_TSC1234;

const should_match: string = 1 as ignore_TSC2322;
