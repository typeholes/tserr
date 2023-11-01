import { ErrDescState } from './ErrDescState';
import { ErrParserState } from './ErrParserState';
import { ErrState } from './ErrState';
import { ErrLocationState } from './ErrLocationState';
import { reactive } from 'vue';
import { State, mkState } from './state';

type Evaluate<t> = { [k in keyof t]: t[k] } & unknown;

export const states = reactive({
  ErrLocation: ErrLocationState,
  ErrDesc: ErrDescState,
  ErrParser: ErrParserState,
  Err: ErrState,
});

type States = typeof states;
type StateName = keyof States;

type RelationBy<T extends StateName, U extends StateName> = (
  t: NonNullable<ReturnType<States[T]['get']>>,
) => NonNullable<ReturnType<States[U]['get']>>[];

type ManualRelationBy<T extends StateName, U extends StateName> = ((
  t: NonNullable<ReturnType<States[T]['get']>>,
) => NonNullable<ReturnType<States[U]['get']>>[]) &
  State<
    `${T}$FK$${U}`,
    [ValueTypeFor<T>, ValueTypeFor<U>],
    [...StateKeyFor<States[T]>, '$FK$', ...StateKeyFor<States[T]>]
  >;

type StateKeyFor<T> = T extends State<string, any, infer K> ? K : never;
type ValueTypeFor<T extends StateName> = NonNullable<
  ReturnType<States[T]['get']>
>;

const relations = {
  Parent: {
    ...relate('Err', 'ErrDesc', (t) =>
      single(states.ErrDesc.getByKeys(t.name)),
    ),
    ...relate('ErrParser', 'ErrDesc', (t) =>
      single(states.ErrDesc.getByKeys(t.name)),
    ),
  },
  At: {
    ...manualFK('ErrLocation', 'Err'),
  },
} as const;

type Relations = typeof relations;

function relate<
  T extends StateName,
  U extends StateName,
  By extends RelationBy<T, U>,
>(t: T, u: U, by: By): Record<T, Record<U, By>> {
  return { [t]: { [u]: by } } as never;
}

// used for relations with no function to the related value
function manualFK<T extends StateName, U extends StateName>(
  t: T,
  u: U,
): Record<T, Record<U, ManualRelationBy<T, U>>> {
  const state = mkState(
    `${t}$FK$${u}`,
    (
      pair: [
        NonNullable<ReturnType<States[T]['get']>>,
        NonNullable<ReturnType<States[U]['get']>>,
      ],
    ) => [
      ...states[t].toKeys(pair[0] as never),
      '$FK$',
      ...states[u].toKeys(pair[1] as never),
    ],
  );

  const fn = function (v: ValueTypeFor<T>) {
    return state.values(...states[t].toKeys(v as never));
  };
  Object.assign(fn, state);

  return { [t]: { [u]: fn } } as never;
}

function mkSchema() {
  const schema = { ...states };
  const _schema = schema as Record<string, any>;
  for (const name in states) {
    for (const alias in relations) {
      const relation = relations[alias as keyof Relations];
      if (name in relation) {
        const fn = relation[name as keyof typeof relation];
        _schema[name]['$'] ??= {};
        _schema[name]['$'][`${alias}`] = fn;
      }
    }
  }

  return schema as {
    [K in keyof States]: Evaluate<States[K] & { $: FilterRelations<K> }>;
  };
}

export const schema = mkSchema();

// const _desc = schema.ErrLocation.$.At.Err;

type FilterRelations<From extends StateName> = {
  [Alias in keyof Relations as From extends keyof Relations[Alias]
    ? Alias
    : never]: Relations[Alias][From extends keyof Relations[Alias]
    ? From
    : never];
};

function single<T>(t: T | undefined) {
  return t === undefined ? [] : [t];
}
