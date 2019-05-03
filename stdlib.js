function properDivisors (n) {
    let rRoot = Math.sqrt(n),
        intRoot = Math.floor(rRoot),
        blnPerfectSquare = rRoot === intRoot,
        lows = range(1, intRoot)
        .filter(x => (n % x) === 0);
    return lows.concat(lows
        .map(x => n / x)
        .reverse()
        .slice(blnPerfectSquare | 0)
    ).slice(0, -1);
}
function range (m, n) {
    if (m > n) return range(n, m);
    return Array.from({
        length: (n - m) + 1
    }, (_, i) => m + i);
}
function powerset (n) {
    return n.reduce((sub,val) => sub.concat(
        sub.map(set => [val,...set])
    ),[[]]);
}
function toArr (n) {
    return (Array.isArray(__intermed_val=n)
            ?__intermed_val
            :typeof(__intermed_val)==='string'
                ?__intermed_val.split('')
                :typeof(__intermed_val)==='number'
                    ?__intermed_val.toString().split('').map(x=>parseInt(x))
                    :__intermed_val.toString().split(''));
}
function isPrime(number)
{ 
    if (number <= 1) return false;
    if (number <= 3) return true;
    if (number%2 == 0 || number%3 == 0) return false;
    for (var i=5; i*i<=number; i=i+6) {
        if (number%i == 0 || number%(i+2) == 0)
            return false;
    }
    return true;
}
function factorial(n)
{
    if (n == 0) return 1;
    return n * factorial(n-1);
}
function permutations(input, permArr=[], usedChars=[]) {
    input = toArr(input);
    var i, ch;
    for (i = 0; i < input.length; i++) {
        ch = input.splice(i, 1)[0];
        usedChars.push(ch);
        if (input.length == 0) {
            permArr.push(usedChars.slice());
        }
        permutations(input, permArr, usedChars);
        input.splice(i, 0, ch);
        usedChars.pop();
    }
    return permArr
};
function distinct(arr) {
    arr = toArr(arr);
    newArr = [];
    for(let a of arr) {
        if (!newArr.includes(a)) newArr.push(a);
    }
    return newArr;
}
function repeatArr(arr, n) {
    let newArr = [];
    for(let i = 0; i < n; i++) newArr = newArr.concat(arr);
    return newArr;
}
function repeat(x, n) {
    return Array.isArray(x)
        ? repeatArr(x, n)
        : typeof(x) === "string"
            ? x.repeat(n)
            : typeof(x) === "number"
                ? parseInt(x.toString().repeat(n))
                : x.toString().repeat(n);
}