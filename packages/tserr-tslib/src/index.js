import { watchMain } from './project';
console.log(process.argv[2]);
const dir = process.argv[2];
const file = process.argv[3];
watchMain(dir, file);
//# sourceMappingURL=index.js.map