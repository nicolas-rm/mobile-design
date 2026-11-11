export const buttonGroupUsageExamples = [
    {
        id: 'welcome',
        title: 'Welcome · Get started',
        icon: 'waving_hand',
        reference: 'https://m3.material.io/components/button-groups/guidelines#usage',
    },
    {
        id: 'call',
        title: 'Video call',
        icon: 'videocam',
        reference: 'https://m3.material.io/components/button-groups/guidelines#responsive-layout',
    },
    { id: 'files', title: 'Files', icon: 'folder_open', reference: 'https://m3.material.io/components/button-groups/guidelines#usage' },
    {
        id: 'shopping',
        title: 'Shopping',
        icon: 'shopping_bag',
        reference: 'https://m3.material.io/components/button-groups/guidelines#usage',
    },
    {
        id: 'filters',
        title: 'Filters',
        icon: 'filter_list',
        reference: 'https://m3.material.io/components/button-groups/guidelines#selection',
    },
    {
        id: 'calculator',
        title: 'Calculator',
        icon: 'calculate',
        reference: 'https://m3.material.io/components/button-groups/guidelines#interaction',
    },
    {
        id: 'music',
        title: 'The Lawerence tree',
        icon: 'music_note',
        reference: 'https://m3.material.io/components/button-groups/guidelines#responsive-layout',
    },
    {
        id: 'social',
        title: 'Photo actions',
        icon: 'add_reaction',
        reference: 'https://m3.material.io/components/button-groups/guidelines#usage',
    },
    { id: 'email', title: 'Dinner Club', icon: 'mail_outline', reference: 'https://m3.material.io/components/button-groups/accessibility' },
] as const;

export type ButtonGroupUsageScenario = (typeof buttonGroupUsageExamples)[number]['id'];

export const buttonGroupFiles = [
    {
        id: 'projects',
        name: 'Projects',
        destination: 'my-files',
        icon: 'folder',
        description: 'Design review notes and component references.',
    },
    {
        id: 'photos',
        name: 'Photos',
        destination: 'my-files',
        icon: 'folder',
        description: 'Photos from the garden, the coast, and the city.',
    },
    {
        id: 'documents',
        name: 'Documents',
        destination: 'my-files',
        icon: 'folder',
        description: 'Personal notes, travel plans, and reading lists.',
    },
    {
        id: 'team',
        name: 'Team collection',
        destination: 'shared',
        icon: 'folder_shared',
        description: 'Files shared with Lee, Alex, and Taylor.',
    },
    {
        id: 'plans',
        name: 'Project plans',
        destination: 'shared',
        icon: 'folder_shared',
        description: 'Schedule and next steps for the design project.',
    },
    { id: 'laptop', name: 'My laptop', destination: 'computers', icon: 'laptop', description: 'Documents synchronized from your laptop.' },
    {
        id: 'desktop',
        name: 'Desktop',
        destination: 'computers',
        icon: 'desktop_windows',
        description: 'Files synchronized from your desktop computer.',
    },
] as const;

export const buttonGroupPlaces = [
    { id: 'garden', name: 'Garden café', price: '$', distance: 1.8, relevance: 1 },
    { id: 'corner', name: 'The corner kitchen', price: '$$', distance: 0.4, relevance: 2 },
    { id: 'market', name: 'Market table', price: '$$', distance: 0.9, relevance: 3 },
    { id: 'terrace', name: 'The terrace', price: '$$$', distance: 0.2, relevance: 4 },
    { id: 'tasting', name: 'Tasting room', price: '$$$$', distance: 2.1, relevance: 5 },
] as const;

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
