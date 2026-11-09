import {
    Children,
    createContext,
    createElement,
    useCallback,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
    type ComponentPropsWithRef,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Text, useMobileTheme, type TextVariant } from 'mobile-design/react-native-web';

const RoleContext = createContext<TextVariant>('bodyLarge');
type TextRun = { key: string; host: HTMLSpanElement; variant: TextVariant; content: string | number };
type RegisterRun = (host: HTMLSpanElement, variant: TextVariant, content: string | number) => () => void;
const TextRunContext = createContext<RegisterRun | null>(null);
type ProseTag = 'div' | 'p' | 'span' | 'label' | 'a' | 'strong' | 'b' | 'small' | 'li' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
const headingRoles: Partial<Record<ProseTag, TextVariant>> = {
    h1: 'headlineLarge',
    h2: 'headlineSmall',
    h3: 'titleLarge',
    h4: 'titleMedium',
    h5: 'titleSmall',
    h6: 'titleSmall',
};

function InlineRun({ variant, children }: { variant: TextVariant; children: string | number }) {
    const register = useContext(TextRunContext),
        [host, setHost] = useState<HTMLSpanElement | null>(null);
    useLayoutEffect(() => (host && register ? register(host, variant, children) : undefined), [host, register, variant, children]);
    return <span ref={setHost} />;
}

/** Keep real HTML labels/links and their handlers. Text draws the readable runs. */
export function Prose<Tag extends ProseTag>({ as, children, ...props }: { as: Tag } & ComponentPropsWithRef<Tag>) {
    const inherited = useContext(RoleContext),
        theme = useMobileTheme();
    const className = props.className ?? '';
    let variant: TextVariant = headingRoles[as] ?? (as === 'label' ? 'labelLarge' : as === 'small' ? 'bodySmall' : inherited);
    if (/example-result|preview-guidance|type-metrics|type-specimen-meta/.test(className)) variant = 'bodySmall';
    if ((as === 'strong' || as === 'b') && !variant.endsWith('Emphasized')) variant = (variant + 'Emphasized') as TextVariant;
    const font = theme.fonts[variant as keyof typeof theme.fonts] as { fontSize: number; lineHeight: number; letterSpacing: number };
    const style = { ...props.style, fontSize: font.fontSize, lineHeight: font.lineHeight + 'px', letterSpacing: font.letterSpacing };
    const content = Children.map(children as ReactNode, (child) =>
        typeof child === 'string' || typeof child === 'number' ? <InlineRun variant={variant}>{child}</InlineRun> : child
    );
    return <RoleContext.Provider value={variant}>{createElement(as, { ...props, style }, content)}</RoleContext.Provider>;
}

/** Text's inline context belongs only to the editorial runs. Putting the whole
 * component gallery inside Text also makes RN Web Views inline-flex: absolute
 * menus and draggable collections then lose their available width.
 * Portals preserve real Text inside semantic HTML without changing RN layouts.
 */
export function RuntimeTextRoot({ children }: { children: ReactNode }) {
    const [runs, setRuns] = useState<Map<HTMLSpanElement, TextRun>>(() => new Map()),
        sequence = useRef(0);
    const register = useCallback<RegisterRun>((host, variant, content) => {
        const run = { key: String(++sequence.current), host, variant, content };
        setRuns((current) => new Map(current).set(host, run));
        return () =>
            setRuns((current) => {
                if (current.get(host) !== run) return current;
                const next = new Map(current);
                next.delete(host);
                return next;
            });
    }, []);
    const style = { display: 'contents' as const, color: 'inherit', whiteSpace: 'normal' };
    return (
        <TextRunContext.Provider value={register}>
            <div data-runtime-text-root="true" style={{ display: 'contents' }}>
                {children}
            </div>
            <Text style={style} {...{ dataSet: { runtimeTextAncestor: 'true' } }}>
                {[...runs.values()].map((run) =>
                    createPortal(
                        <Text variant={run.variant} style={{ color: 'inherit' }} {...{ dataSet: { runtimeText: run.variant } }}>
                            {run.content}
                        </Text>,
                        run.host,
                        run.key
                    )
                )}
            </Text>
        </TextRunContext.Provider>
    );
}
