import type { Space } from 'arktype';

type OrderedSplitEntry<S, K extends keyof Space<S>> = Space<S>[K]['infer'] & {
  getOrder(): number;
};

type ArkSplitter<S> = (
  s: Space<S>
) => (
  x: unknown[],
  onDuplicate?: 'throw' | 'first' | 'all',
  into?: { [K in keyof Space<S>]: OrderedSplitEntry<S, K>[] } | undefined
) => { [K in keyof Space<S>]: OrderedSplitEntry<S, K>[] };
// sample output {"a":[],"b":[{"type":"b"}],"c":[{"type":"c"},{"type":"c"}]}

type ArkSplitResult<S> = ReturnType<ReturnType<ArkSplitter<S>>>;

export function arkSplitter<S>(space: Space<S>): ReturnType<ArkSplitter<S>> {
  return (
    xs: unknown[],
    onDuplicate: 'throw' | 'first' | 'all' = 'throw',
    into?: ArkSplitResult<S> | undefined
  ) => {
    const ret: ArkSplitResult<S> =
      into ??
      (Object.fromEntries(Object.keys(space).map((x) => [x, []])) as never);

    let order = -1;
    for (const obj of xs) {
      order++;
      let matches = 0;
      for (const k in space) {
        const type = space[k];
        if (type.allows(obj)) {
          if (matches > 0) {
            if (onDuplicate === 'throw') {
              throw new Error('duplicate type match');
            }
            if (onDuplicate === 'first') {
              continue;
            }
          }

          const orderUnclosed = order;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj as any).getOrder = () => orderUnclosed;
          ret[k].push(obj as never);
          matches++;
        }
      }
      if (matches === 0) {
        // handle unmatched here
      }
    }
    return ret;
  };
}

// const _types = scope({
//   a: { type: "'a'" },
//   c: { type: "'c'" },
//   b: { type: "'b'" },
//   bc: 'b|c'
// })
// const types = _types.compile()

// const splitTypes = arkSplitter(types)
// type SplitTypes = ReturnType<typeof splitTypes>

// const obj = [{ type: 'b' }, { type: 'c' }, { type: 'c' }]
// console.log(splitTypes(obj))
