import { reactive } from 'vue';
import { ParsedError } from './ParsedError';
import { ValueMap } from './ValueMap';
import { PluginName } from './brands';
import { uniqObjects } from './util';

export type FlatErrKey = FlatErr['parsed'];
export type FlatErrValue = Omit<FlatErr, 'parsed'>;
export type FlatErrMap = ValueMap<FlatErrKey, FlatErrValue, string>;

export function errMap(
  errs: FlatErr[],
  monoid?: (a: FlatErrValue, b: FlatErrValue) => FlatErrValue,
): ValueMap<FlatErrKey, FlatErrValue, string> {
  const ret = new ValueMap<FlatErrKey, FlatErrValue, string>(
    JSON.stringify,
    monoid,
    undefined,
    reactive as never,
  );
  for (const err of errs) {
    ret.set(err.parsed, { sources: err.sources });
  }

  return ret;
}

export type Span = {
  start: { line: number; char: number };
  end: { line: number; char: number };
};

export type Err = {
  fileName: string;
  code: string;
  span: Span;
  lines: string[];
  parsed: ParsedError[];
  children: Err;
  src?: string | undefined;
}[];

export type FlatErr = {
  parsed: { depth: number; value: ParsedError }[];
  sources: Record<
    PluginName,
    Record<
      string,
      { code: string; raw: string[]; span: Span; src?: string | undefined }[]
    >
  >;
};

function _flattenErr(pluginName: PluginName, e: Err[0]): FlatErr {
  const parsed: FlatErr['parsed'] = [];
  let value: FlatErrValue = {
    sources: {
      [pluginName]: {
        [e.fileName]: [
          { code: e.code, raw: e.lines, span: e.span, src: e.src },
        ],
      },
    },
  };
  function go(e: Err[0], depth: number) {
    value = mergeSources(
      {
        sources: {
          [pluginName]: {
            [e.fileName]: [
              { code: e.code, raw: e.lines, span: e.span, src: e.src },
            ],
          },
        },
      },
      value,
    );
    const add: FlatErr['parsed'] = e.parsed.map((value) => ({
      depth,
      value,
    }));
    parsed.push(...add);
    e.children.forEach((c) => go(c, depth + 1));
  }

  go(e, 0);

  const ret: FlatErr = {
    ...e,
    parsed: parsed,
    sources: value.sources,
  };

  return ret;
}

export function flattenErr(pluginName: PluginName, e: Err): FlatErr {
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

export function mergeSources(a: FlatErrValue, b: FlatErrValue): FlatErrValue {
  const ret: FlatErrValue['sources'] = {};

  for (const _plugin in a.sources) {
    const plugin = _plugin as PluginName;
    ret[plugin] = { ...a.sources[plugin] };
  }

  for (const _plugin in b.sources) {
    const plugin = _plugin as PluginName;
    if (!(plugin in ret)) {
      ret[plugin] = { ...b.sources[plugin] };
      continue;
    }

    for (const file in b.sources[plugin]) {
      if (!(file in ret[plugin])) {
        ret[plugin][file] = [...b.sources[plugin][file]];
        continue;
      }
      ret[plugin][file] = uniqObjects(
        JSON.stringify,
        ret[plugin][file],
        b.sources[plugin][file],
      );
    }
  }
  return { sources: ret };
}
