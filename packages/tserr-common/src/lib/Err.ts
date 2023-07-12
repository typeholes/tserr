import { ParsedError } from './ParsedError';
import { PluginName } from './brands';

export type Err = {
  code: string;
  span: {
    start: { line: number; char: number };
    end: { line: number; char: number };
  };
  lines: string[];
  parsed: ParsedError[];
  children: Err;
}[];

export type FlatErr = {
  span: {
    start: { line: number; char: number };
    end: { line: number; char: number };
  };
  parsed: [id: number, depth: number, parsed: ParsedError][];
  sources: Record<PluginName, [code: string, raw: string[]][]>;
};

let parsedId = 0;
function _flattenErr(pluginName: PluginName, e: Err[0]): FlatErr {
  const parsed: [id: number, depth: number, parsed: ParsedError][] = [];
  const source: [code: string, raw: string[]][] = [];
  function go(e: Err[0], depth: number) {
    source.push([e.code, e.lines]);
    const add: [id: number, depth: number, parsed: ParsedError][] =
      e.parsed.map((p) => [parsedId++, depth, p]);
    parsed.push(...add);
    e.children.forEach((c) => go(c, depth + 1));
  }

  go(e, 0);

  const ret: FlatErr = {
    ...e,
    parsed: parsed,
    sources: { [pluginName]: source },
  };

  return ret;
}

export function flattenErr(
  pluginName: PluginName,
  e: Err,
  endLine: number,
): FlatErr {
  const flatArr = e.map((x) => _flattenErr(pluginName, x));
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
