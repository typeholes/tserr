"use strict";
/*
Thank you @ArkDavid for providing this test case.
@everyone, check out ArkType.io
   ArkType is a runtime validation library that can infer TypeScript definitions 1:1 and reuse them as highly-optimized validators for your data.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareStrictness = exports.Disjoint = exports.RangeNode = void 0;
// And here
exports.RangeNode = defineNode((rule) => [`${rule}`], (l, r) => {
    const lMin = l.rule.min;
    const lMax = l.rule.max;
    const rMin = r.rule.min;
    const rMax = r.rule.max;
    const stricterMin = (0, exports.compareStrictness)('min', lMin, rMin);
    const stricterMax = (0, exports.compareStrictness)('max', lMax, rMax);
    if (stricterMin === 'l') {
        if (stricterMax === 'r') {
            return (0, exports.compareStrictness)('min', lMin, rMax) === 'l'
                ? Disjoint.from('range', l, r)
                : {
                    min: lMin,
                    max: rMax,
                };
        }
        return l.rule;
    }
    if (stricterMin === 'r') {
        if (stricterMax === 'l') {
            return (0, exports.compareStrictness)('max', lMax, rMin) === 'l'
                ? Disjoint.from('range', l, r)
                : {
                    min: rMin,
                    max: lMax,
                };
        }
        return r.rule;
    }
    return stricterMax === 'l' ? l.rule : r.rule;
}, (base) => class extends base {
    constructor() {
        super(...arguments);
        this.kind = 'range';
    }
    describe() {
        return this.rule.min
            ? this.rule.max
                ? `the range bounded by ${boundToExpression('min', this.rule.min)} and ${boundToExpression('max', this.rule.max)}`
                : boundToExpression('min', this.rule.min)
            : this.rule.max
                ? boundToExpression('max', this.rule.max)
                : 'the unbounded range';
    }
});
class Disjoint {
    constructor(sources) {
        this.sources = sources;
    }
    static from(kind, l, r) {
        return new Disjoint({});
    }
}
exports.Disjoint = Disjoint;
const defineBase = (intersectRules, create) => {
    const intersections = {};
    class BaseNode {
        constructor(rule, condition, subconditions) {
            this.rule = rule;
            this.condition = condition;
            this.subconditions = subconditions;
        }
        intersect(other) {
            if (this === other) {
                return this;
            }
            if (intersections[this.condition][other.condition]) {
                return intersections[this.condition][other.condition];
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
function defineNode(compile, intersect, extend) {
    const instances = {};
    const create = (rule) => {
        const subconditions = compile(rule);
        const condition = subconditions.join(' && ') ?? 'true';
        if (instances[condition]) {
            return instances[condition];
        }
        const instance = extend(defineBase(intersect, create));
        instances[condition] = instance;
        return instance;
    };
    return create;
}
const boundToExpression = (kind, bound) => `${kind === 'min' ? '>' : '<'}${bound.exclusive ? '' : '='}${bound.limit}`;
const compareStrictness = (kind, l, r) => !l
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
exports.compareStrictness = compareStrictness;
//# sourceMappingURL=arkType.js.map