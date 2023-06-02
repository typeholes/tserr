
type List<T> = undefined | [ T, List<T> ]

const cycles : List<number> = 
 [ 1, [2, [ 3, [4, undefined]]]];

 cycles![1]![1]![1]![1] = cycles;
 
 function take<T>(n: number, l: List<T>) : T[] {
    function go(n: number, l: List<T>, acc: T[]) : T[] {
        if (n === 0 || l === undefined) return acc;
        acc.push(l[0]);
        return go(n-1, l[1], acc);
    }
    return go(n,l,[]);
 }