export type CalculatorState = { entry: string; replace: boolean; expression: string };
export const initialCalculator: CalculatorState = { entry: '0', replace: false, expression: '' };
const formatResult = (value: number) => (Number.isFinite(value) ? String(Number(value.toPrecision(12))) : 'Error');

/** Restricted arithmetic grammar; user input never executes JavaScript. */
export function evaluateCalculator(expression: string): number {
    const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+−-]?\d+)?|[()+−×÷%√!πe-]/g) ?? [];
    if (tokens.join('') !== expression) return NaN;
    let cursor = 0;
    const factorial = (value: number) => {
        if (!Number.isInteger(value) || value < 0 || value > 170) return NaN;
        let result = 1;
        for (let number = 2; number <= value; number++) result *= number;
        return result;
    };
    const factor = (): number => {
        const token = tokens[cursor++];
        let value: number;
        if (token === '√') value = Math.sqrt(factor());
        else if (token === '−' || token === '-') value = -factor();
        else if (token === '(') {
            value = sum();
            if (tokens[cursor++] !== ')') return NaN;
        } else value = token === 'π' ? Math.PI : token === 'e' ? Math.E : token === undefined ? NaN : Number(token);
        while (tokens[cursor] === '%' || tokens[cursor] === '!') value = tokens[cursor++] === '%' ? value / 100 : factorial(value);
        return value;
    };
    const product = (): number => {
        let value = factor();
        while (tokens[cursor] === '×' || tokens[cursor] === '÷') value = tokens[cursor++] === '×' ? value * factor() : value / factor();
        return value;
    };
    const sum = (): number => {
        let value = product();
        while (tokens[cursor] === '+' || tokens[cursor] === '−' || tokens[cursor] === '-')
            value = tokens[cursor++] === '+' ? value + product() : value - product();
        return value;
    };
    const value = sum();
    return cursor === tokens.length ? value : NaN;
}

export function updateCalculator(previous: CalculatorState, key: string): CalculatorState {
    if (key === 'AC') return { ...initialCalculator };
    if (key === 'backspace')
        return {
            ...previous,
            entry: previous.entry.length > 1 && previous.entry !== 'Error' ? previous.entry.slice(0, -1) : '0',
            replace: false,
        };
    if (key === '=') return { entry: formatResult(evaluateCalculator(previous.entry)), replace: true, expression: `${previous.entry} =` };
    let entry = previous.entry === 'Error' || (previous.replace && !['+', '−', '×', '÷', '%', '!'].includes(key)) ? '0' : previous.entry;
    if (key === '()') {
        const balance = (entry.match(/\(/g)?.length ?? 0) - (entry.match(/\)/g)?.length ?? 0);
        if (balance > 0 && /[\dπe)%!]$/.test(entry)) entry += ')';
        else entry = entry === '0' ? '(' : `${entry}${/[\dπe)%!]$/.test(entry) ? '×' : ''}(`;
    } else if (key === '.') {
        if ((entry.match(/[\d.]+$/)?.[0] ?? '').includes('.')) return previous;
        entry += /[\d]$/.test(entry) ? '.' : '0.';
    } else if (/^\d$/.test(key)) entry = entry === '0' ? key : `${entry}${/[πe)]$/.test(entry) ? '×' : ''}${key}`;
    else if (key === 'π' || key === 'e' || key === '√')
        entry = entry === '0' ? key : `${entry}${/[\dπe)%!]$/.test(entry) ? '×' : ''}${key}`;
    else if (key === '%' || key === '!') {
        if (!/[\dπe)]$/.test(entry)) return previous;
        entry += key;
    } else if (['+', '−', '×', '÷'].includes(key)) entry = /[+−×÷]$/.test(entry) ? entry.slice(0, -1) + key : entry + key;
    else return previous;
    return entry.length > 80 ? previous : { entry, replace: false, expression: '' };
}
