import { State, mkState } from './state';

import { Err, ErrDesc, ErrLocation, ErrParser } from './models/ErrDesc';
export * from './models/ErrDesc';

import { ProjectDesc } from './models/ProjectDesc';
import { PluginDesc } from '@typeholes/tserr-common';
export * from './models/ProjectDesc';

type Evaluate<t> = { [k in keyof t]: t[k] } & unknown;

// only use once, and only in the front end
export function _mkSchema() {
  const states = ({
    ErrLocation: mkState('ErrLocation', (u: ErrLocation) => [
      u.fileName,
      u.span.start.line,
      u.span.start.char,
      u.span.end.line,
      u.span.end.line,
    ]),
    ErrDesc: mkState<'ErrDesc', ErrDesc<string>, [string]>(
      'ErrDesc',
      (x: ErrDesc<string>) => [x.name],
    ),
    ErrParser: mkState(
      'ErrParser',
      (x: ErrParser<ErrDesc<string>>) => [x.source, x.name] as const,
      false,
    ),
    Err: mkState(
      'Err',
      (x: Err<ErrDesc<string>>) => [x.name, ...Object.keys(x.values)] as const,
    ),
    Project: mkState('Project', (x: ProjectDesc) => [x.path, x.filename]),
    Plugin: mkState('Plugin', (x: PluginDesc) => [x.name])
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
      ...manualFK('Project', 'Project'),
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
      return state
        .values(...(states[t].toKeys(v as never) ?? []))
        .map((a) => a[1]);
    };
    Object.assign(fn, state);

    return { [t]: { [u]: fn } } as never;
  }

  function mkSchema() {
    const schema = { ...states };
    const _schema = schema as Record<string, any>;
    for (const name in schema) {
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

  const schema = mkSchema();

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

  return schema;
}

export type Schema = ReturnType<typeof _mkSchema>;
