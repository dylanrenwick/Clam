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
    return Array.from({
        length: (n - m) + 1
    }, (_, i) => m + i);
}
function powerset (n) {
    return n.reduce((sub,val) => sub.concat(
        sub.map(set => [val,...set])
    ),[[]]);
}