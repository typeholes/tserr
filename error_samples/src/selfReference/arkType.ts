/*
Thank you @ArkDavid for providing this test case.
@everyone, check out ArkType.io
   ArkType is a runtime validation library that can infer TypeScript definitions 1:1 and reuse them as highly-optimized validators for your data.
*/

// Circularity errors are here
// type foo = typeof RangeNode;
// type bar = ReturnType<foo>;
export type RangeNode = ReturnType<typeof RangeNode>;

type DisjointKinds = {
   range?: {
      // And here
      l: RangeNode;
      r: RangeNode;
   };
};

// And here
export const RangeNode = defineNode(
   (rule: Range) => [`${rule}`],
   (l, r) => {
      const lMin = l.rule.min;
      const lMax = l.rule.max;
      const rMin = r.rule.min;
      const rMax = r.rule.max;
      const stricterMin = compareStrictness('min', lMin, rMin);
      const stricterMax = compareStrictness('max', lMax, rMax);
      if (stricterMin === 'l') {
         if (stricterMax === 'r') {
            return compareStrictness('min', lMin, rMax) === 'l'
               ? Disjoint.from('range', l, r)
               : {
                    min: lMin!,
                    max: rMax!,
                 };
         }
         return l.rule;
      }
      if (stricterMin === 'r') {
         if (stricterMax === 'l') {
            return compareStrictness('max', lMax, rMin) === 'l'
               ? Disjoint.from('range', l, r)
               : {
                    min: rMin!,
                    max: lMax!,
                 };
         }
         return r.rule;
      }
      return stricterMax === 'l' ? l.rule : r.rule;
   },
   (base) =>
      class extends base {
         readonly kind = 'range';

         describe() {
            return this.rule.min
               ? this.rule.max
                  ? `the range bounded by ${boundToExpression(
                       'min',
                       this.rule.min
                    )} and ${boundToExpression('max', this.rule.max)}`
                  : boundToExpression('min', this.rule.min)
               : this.rule.max
               ? boundToExpression('max', this.rule.max)
               : 'the unbounded range';
         }
      }
);

type DisjointKind = keyof DisjointKinds;

export class Disjoint {
   constructor(public sources: unknown) {}

   static from<kind extends DisjointKind>(
      kind: kind,
      l: Required<DisjointKinds>[kind]['l'],
      r: Required<DisjointKinds>[kind]['r']
   ) {
      return new Disjoint({});
   }
}

type Intersection<instance, rule> = (
   l: instance,
   r: instance
) => rule | Disjoint;

type Base<rule> = ReturnType<typeof defineBase<rule>>;

type Instance<rule> = InstanceType<Base<rule>>;

const defineBase = <rule>(
   intersectRules: Intersection<any, rule>,
   create: (rule: rule) => any
) => {
   const intersections: {
      [lCondition: string]: {
         [rCondition: string]: Base<unknown> | Disjoint;
      };
   } = {};

   abstract class BaseNode {
      abstract kind: string;

      constructor(
         public rule: rule,
         public condition: string,
         public subconditions: string[]
      ) {}

      intersect(other: this): this | Disjoint {
         if (this === (other as unknown)) {
            return this;
         }
         if (intersections[this.condition][other.condition]) {
            return intersections[this.condition][other.condition] as never;
         }
         const result = intersectRules(this.rule, other.rule);
         if (result instanceof Disjoint) {
            intersections[this.condition][other.condition] = result;
            intersections[other.condition][this.condition] = result;
            return result;
         }
         const nodeResult = create(result);
         intersections[this.condition][other.condition] = nodeResult;
         intersections[other.condition][this.condition] = nodeResult;
         return nodeResult;
      }
   }
   return BaseNode;
};

function defineNode<rule, instance extends Instance<rule>>(
   compile: (rule: rule) => string[],
   intersect: Intersection<instance, rule>,
   extend: (
      base: Base<rule>
   ) => new (...args: ConstructorParameters<Base<rule>>) => instance
) {
   const instances: {
      [condition: string]: instance;
   } = {};

   const create = (rule: rule): instance => {
      const subconditions = compile(rule);
      const condition = subconditions.join(' && ') ?? 'true';
      if (instances[condition]) {
         return instances[condition];
      }
      const instance = extend(
         defineBase(intersect as never, create)
      ) as unknown as instance;
      instances[condition] = instance;
      return instance;
   };
   return create;
}

export type Bound = {
   limit: number;
   exclusive?: true;
};

export type Range = {
   min?: Bound;
   max?: Bound;
};

const boundToExpression = (
   kind: keyof Range,
   bound: Bound
): `${Comparator}${number}` =>
   `${kind === 'min' ? '>' : '<'}${bound.exclusive ? '' : '='}${bound.limit}`;

export const compareStrictness = (
   kind: 'min' | 'max',
   l: Bound | undefined,
   r: Bound | undefined
) /* : "=" | "r" | "l" */ =>
   !l
      ? !r
         ? '='
         : 'r'
      : !r
      ? 'l'
      : l.limit === r.limit
      ? l.exclusive
         ? r.exclusive
            ? '='
            : 'l'
         : r.exclusive
         ? 'r'
         : '='
      : kind === 'min'
      ? l.limit > r.limit
         ? 'l'
         : 'r'
      : l.limit < r.limit
      ? 'l'
      : 'r';

export type Comparator = '==' | '<' | '>' | '<=' | '>=';
