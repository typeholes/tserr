
export type ErrDesc<T extends string = string> = {
  name: T;
  keys: readonly string[];
  template?: string;
};

export type Err<T extends ErrDesc> = {
  name: T['name'];
  values: { [K in T['keys'][number]]: string };
};

type _TupleOfString<T> = { [K in keyof T]: string };
export type ErrParser<T extends ErrDesc> = {
  name: T['name'];
  source: string;
  parse(text: string): undefined | _TupleOfString<T['keys']>;
};

export function parseError<T extends ErrDesc>(
  desc: T,
  parser: ErrParser<T>,
  msg: string,
): Err<T> | undefined {
  if (desc.name !== parser.name) {
    throw new Error(
      `Parser ${parser.name} mismatch with description ${desc.name}`,
    );
  }
  const values = parser.parse(msg);
  if (values === undefined) {
    return undefined;
  }

  const entries = desc.keys.map((k, i) => [k, values[i]]);
  return { name: desc.name, values: Object.fromEntries(entries) };
}

export type Position = { line: number; char: number };
export type Span = { start: Position; end: Position };
export type ErrLocation = {
  fileName: string;
  span: Span;
};
