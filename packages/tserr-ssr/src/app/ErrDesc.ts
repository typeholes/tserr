import { compile, reactive } from 'vue';

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
  parse(text: string): _TupleOfString<T['keys']>;
};

export const SyntaxErrorDesc = {
  name: 'SyntaxError',
  keys: ['SyntaxError'],
  template: `
   <div> {{err.values.SyntaxError}} </div>
    `,
} as const;
type SyntaxErrorDesc = typeof SyntaxErrorDesc;

export const SyntaxErrorValue: Err<SyntaxErrorDesc> = {
  name: 'SyntaxError',
  values: { SyntaxError: 'Element is missing end tag' },
};

export const SyntaxErrorParser: ErrParser<SyntaxErrorDesc> = {
  name: 'SyntaxError',
  source: 'dummy',
  parse: (text) => [text.replace(/^.*: */, '').replace(/\.$/, '')],
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

export const components: Record<
  string,
  {
    // eslint-disable-next-line @typescript-eslint/ban-types
    current: { template: string; render?: Function };
    // eslint-disable-next-line @typescript-eslint/ban-types
    prev: { template: string; render?: Function };
  }
> = reactive({
  SyntaxError: {
    current: {
      template: SyntaxErrorDesc.template,
      render: compile(SyntaxErrorDesc.template),
    },
    prev: { template: SyntaxErrorDesc.template, render: undefined },
  },
});
