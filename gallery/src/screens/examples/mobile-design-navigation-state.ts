/** Local catalogue records; no network delivery or account data is involved. */
export type MailFolder = 'inbox' | 'drafts' | 'sent' | 'archive';
export type MailMessage = {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    folder: MailFolder;
    read: boolean;
    starred: boolean;
};
export type MailDraft = Pick<MailMessage, 'to' | 'subject' | 'body'> & { id?: string };
export type MailState = { messages: MailMessage[]; nextId: number };
export type MailAction =
    | { type: 'read'; id: string }
    | { type: 'star'; id: string }
    | { type: 'archive'; id: string }
    | { type: 'restore'; id: string }
    | { type: 'save-draft'; draft: MailDraft }
    | { type: 'send'; draft: MailDraft }
    | { type: 'delete-draft'; id: string }
    | { type: 'reset' };

export function createMailState(): MailState {
    return {
        nextId: 5,
        messages: [
            {
                id: '1',
                from: 'Ana · Diseño',
                to: 'tú@ejemplo.test',
                subject: 'Revisión de componentes',
                body: 'La revisión está lista. Podemos consultar juntos los cambios de navegación y los ejemplos interactivos.',
                folder: 'inbox',
                read: false,
                starred: true,
            },
            {
                id: '2',
                from: 'Luis · Producto',
                to: 'tú@ejemplo.test',
                subject: 'Agenda del proyecto',
                body: 'Confirmemos las actividades de esta semana. Guarda un borrador o responde desde la bandeja local.',
                folder: 'inbox',
                read: false,
                starred: false,
            },
            {
                id: '3',
                from: 'Equipo',
                to: 'tú@ejemplo.test',
                subject: 'Recursos compartidos',
                body: 'La biblioteca reúne los recursos disponibles para el proyecto.',
                folder: 'inbox',
                read: true,
                starred: false,
            },
            {
                id: '4',
                from: 'Tú',
                to: 'equipo@ejemplo.test',
                subject: 'Notas de la revisión',
                body: 'Completar la revisión de accesibilidad y movimiento.',
                folder: 'drafts',
                read: true,
                starred: false,
            },
        ],
    };
}

export function mailReducer(state: MailState, action: MailAction): MailState {
    if (action.type === 'reset') return createMailState();
    if (action.type === 'delete-draft')
        return { ...state, messages: state.messages.filter((message) => message.id !== action.id || message.folder !== 'drafts') };
    if (action.type === 'save-draft' || action.type === 'send') {
        if (action.type === 'send' && (!action.draft.to.trim() || !action.draft.subject.trim())) return state;
        const previous = action.draft.id
            ? state.messages.find((message) => message.id === action.draft.id && message.folder === 'drafts')
            : undefined;
        const message: MailMessage = {
            ...action.draft,
            id: previous?.id ?? String(state.nextId),
            from: 'Tú',
            folder: action.type === 'send' ? 'sent' : 'drafts',
            read: true,
            starred: previous?.starred ?? false,
        };
        return {
            nextId: state.nextId + (previous ? 0 : 1),
            messages: [message, ...state.messages.filter((item) => item.id !== message.id)],
        };
    }
    return {
        ...state,
        messages: state.messages.map((message) =>
            message.id !== action.id
                ? message
                : {
                      ...message,
                      ...(action.type === 'read'
                          ? { read: true }
                          : action.type === 'star'
                            ? { starred: !message.starred }
                            : { folder: action.type === 'archive' ? ('archive' as const) : ('inbox' as const) }),
                  }
        ),
    };
}

export function selectMail(messages: readonly MailMessage[], folder: string, query = '') {
    const normalize = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('es-MX')
            .trim();
    const text = normalize(query);
    return messages.filter(
        (message) =>
            (folder === 'starred' ? message.starred : folder === 'all' || message.folder === folder) &&
            (!text || normalize(`${message.from} ${message.to} ${message.subject} ${message.body}`).includes(text))
    );
}

export type DocumentValue = { text: string; bold: boolean; italic: boolean; favorite: boolean };
export const initialDocument: DocumentValue = {
    text: 'Documento de ejemplo: escribe, aplica formato y guarda una versión.',
    bold: false,
    italic: false,
    favorite: false,
};
export function sameDocument(left: DocumentValue, right: DocumentValue) {
    return left.text === right.text && left.bold === right.bold && left.italic === right.italic && left.favorite === right.favorite;
}
