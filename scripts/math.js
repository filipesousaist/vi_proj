function round(num, decimalPlaces = 0) {
    const power10 = Math.pow(10, decimalPlaces);
    return Math.round(num * power10) / power10;
}