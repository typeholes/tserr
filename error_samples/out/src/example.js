"use strict";
const cycles = [1, [2, [3, [4, undefined]]]];
cycles[1][1][1][1] = cycles;
function take(n, l) {
    function go(n, l, acc) {
        if (n === 0 || l === undefined)
            return acc;
        acc.push(l[0]);
        return go(n - 1, l[1], acc);
    }
    return go(n, l, []);
}
//# sourceMappingURL=example.js.map