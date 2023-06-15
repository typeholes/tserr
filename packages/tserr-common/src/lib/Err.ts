import { ParsedError } from './ParsedError';

export type Err = {
  code: number;
   line: number;
   start: number;
   lines: string[];
   parsed: ParsedError[];
   children: Err;
}[];

export type FlatErr = {
  code: string;
   line: number;
   endLine: number;
   start: number;
   lines: string[];
   codes: number[];
   parsed: [id: number, depth: number, parsed: ParsedError][];
};

let parsedId = 0;
function _flattenErr(e: Err[0], endLine: number): FlatErr {
   const parsed: [id: number, depth: number, parsed: ParsedError][] = [];
   const codes : number[] =[];
   function go(e: Err[0], depth: number) {
      codes.push(e.code);
      const add: [id: number, depth: number, parsed: ParsedError][] =
         e.parsed.map((p) => [parsedId++, depth, p]);
      parsed.push(...add);
      e.children.forEach((c) => go(c, depth + 1));
   }

   go(e, 0);

   const ret: FlatErr = { ...e, code: e.code.toString(), parsed: parsed, codes, endLine };

   return ret;
}

export function flattenErr(e: Err, endLine: number): FlatErr {
   const flatArr = e.map( x => _flattenErr(x, endLine));
   for (let i = 1; i < flatArr.length; i++) {
      flatArr[0].parsed.push(...flatArr[i].parsed);
   }
   return flatArr[0];
}

export function traverseErr<U>(on: (err: Err[0]) => U) {
   return (es: Err) =>
      es.map((e) => ({
         result: on(e),
         children: e.children.map(on),
      }));
}
