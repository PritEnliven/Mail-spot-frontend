import { Fragment, type ReactNode } from 'react';

/**
 * Lightweight markdown → React for AI chat answers.
 * Supports: **bold**, *italic*, `code`, bullet / numbered lists
 * (including nested indented lists), headings, hr (---), paragraphs.
 *
 * Numbered items keep increasing across the whole answer even when
 * bullets interrupt them (each would otherwise restart at 1 in a new <ol>).
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    const tokenRe = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let i = 0;

    while ((match = tokenRe.exec(text)) !== null) {
        if (match.index > last) {
            nodes.push(text.slice(last, match.index));
        }
        const token = match[0];
        if (token.startsWith('**') && token.endsWith('**')) {
            nodes.push(
                <strong key={`${keyPrefix}-b-${i++}`}>{token.slice(2, -2)}</strong>,
            );
        } else if (token.startsWith('*') && token.endsWith('*')) {
            nodes.push(
                <em key={`${keyPrefix}-i-${i++}`}>{token.slice(1, -1)}</em>,
            );
        } else if (token.startsWith('`') && token.endsWith('`')) {
            nodes.push(
                <code key={`${keyPrefix}-c-${i++}`} className="ai-chat-md__code">
                    {token.slice(1, -1)}
                </code>,
            );
        }
        last = match.index + token.length;
    }

    if (last < text.length) {
        nodes.push(text.slice(last));
    }

    return nodes.length > 0 ? nodes : [text];
}

type OlItem = { text: string; value: number; children?: Block[] };
type UlItem = { text: string; children?: Block[] };

type Block =
    | { type: 'p'; text: string }
    | { type: 'ul'; items: UlItem[] }
    | { type: 'ol'; items: OlItem[]; start: number }
    | { type: 'h'; level: 1 | 2 | 3; text: string }
    | { type: 'hr' };

function getIndent(line: string): number {
    const match = /^( *)/.exec(line.replace(/\t/g, '  '));
    return match ? match[1].length : 0;
}

function parseListItems(
    lines: string[],
    startIndex: number,
    baseIndent: number,
    ordered: boolean,
): { items: Array<{ text: string; value?: number; children?: Block[] }>; nextIndex: number } {
    const items: Array<{ text: string; value?: number; children?: Block[] }> = [];
    let i = startIndex;
    const itemRe = ordered
        ? /^(\d+)[.)]\s+(.+)$/
        : /^[-*•]\s+(.+)$/;

    while (i < lines.length) {
        const raw = lines[i].replace(/\t/g, '  ');
        const indent = getIndent(raw);
        const trimmed = raw.trim();

        if (!trimmed) {
            i += 1;
            continue;
        }

        if (indent < baseIndent) break;

        if (indent === baseIndent) {
            const m = itemRe.exec(trimmed);
            if (!m) break;

            const text = ordered ? m[2] : m[1];
            const value = ordered ? Number.parseInt(m[1], 10) || 1 : undefined;
            i += 1;

            // Nested list under this item (deeper indent)
            let children: Block[] | undefined;

            if (i < lines.length) {
                const nextRaw = lines[i].replace(/\t/g, '  ');
                const nextIndent = getIndent(nextRaw);
                const nextTrim = nextRaw.trim();
                const isNestedList = 
                    nextIndent > baseIndent &&
                    (/^[-*•]\s+/.test(nextTrim) || /^\d+[.)]\s+/.test(nextTrim));

                if (isNestedList) {
                    const nestedOrdered = /^\d+[.)]\s+/.test(nextTrim);
                    const nested = parseListItems(lines, i, nextIndent, nestedOrdered);
                    children = [
                        nestedOrdered
                            ? {
                                  type: 'ol',
                                  items: nested.items.map((it, idx) => ({
                                      text: it.text,
                                      value: it.value ?? idx + 1,
                                      children: it.children,
                                  })),
                                  start: nested.items[0]?.value ?? 1,
                              }
                            : {
                                  type: 'ul',
                                  items: nested.items.map((it) => ({
                                      text: it.text,
                                      children: it.children,
                                  })),
                              },
                    ];
                    i = nested.nextIndex;
                }
            }

            items.push({ text, value, children });
            continue;
        }                                    

        // Same/higher indent but not a list item at base — stop
        break;
    }

    return { items, nextIndex: i };
}

function parseBlocks(markdown: string): Block[] {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const blocks: Block[] = [];
    let i = 0;

    while (i < lines.length) {
        const raw = lines[i].replace(/\t/g, '  ');
        const trimmed = raw.trim();

        if (!trimmed) {
            i += 1;
            continue;
        }

        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            blocks.push({ type: 'hr' });
            i += 1;
            continue;
        }

        const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
        if (headingMatch) {
            const level = headingMatch[1].length as 1 | 2 | 3;
            blocks.push({ type: 'h', level, text: headingMatch[2] });
            i += 1;
            continue;
        }

        if (/^[-*•]\s+/.test(trimmed)) {
            const indent = getIndent(raw);
            const { items, nextIndex } = parseListItems(lines, i, indent, false);
            blocks.push({
                type: 'ul',
                items: items.map((it) => ({ text: it.text, children: it.children })),
            });
            i = nextIndex;
            continue;
        }

        if (/^\d+[.)]\s+/.test(trimmed)) {
            const indent = getIndent(raw);
            const { items, nextIndex } = parseListItems(lines, i, indent, true);
            const olItems: OlItem[] = items.map((it, idx) => ({
                text: it.text,
                value: it.value ?? idx + 1,
                children: it.children,
            }));
            blocks.push({
                type: 'ol',
                items: olItems,
                start: olItems[0]?.value ?? 1,
            });
            i = nextIndex;
            continue;
        }

        const paraLines: string[] = [];
        while (i < lines.length) {
            const t = lines[i].trim();
            if (!t) break;
            if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) break;
            if (/^(#{1,3})\s+/.test(t)) break;
            if (/^[-*•]\s+/.test(t)) break;
            if (/^\d+[.)]\s+/.test(t)) break;
            paraLines.push(t);
            i += 1;
        }
        blocks.push({ type: 'p', text: paraLines.join(' ') });
    }

    return blocks;
}

/** Re-number every ordered-list item 1…N across top-level ols in the answer. */
function withSequentialOlNumbers(blocks: Block[]): Block[] {
    let next = 1;
    return blocks.map((block) => {
        if (block.type !== 'ol') return block;
        const items = block.items.map((item) => ({
            ...item,
            value: next++,
        }));
        return {
            ...block,
            items,
            start: items[0]?.value ?? 1,
        };
    });
}

function renderBlocks(blocks: Block[], keyPrefix: string): ReactNode[] {
    return blocks.map((block, idx) => {
        const key = `${keyPrefix}-${idx}`;
        if (block.type === 'hr') {
            return <hr key={key} className="ai-chat-md__hr" />;
        }
        if (block.type === 'h') {
            const Tag = (`h${block.level + 2}` as 'h3' | 'h4' | 'h5');
            return (
                <Tag key={key} className={`ai-chat-md__h ai-chat-md__h--${block.level}`}>
                    {renderInline(block.text, key)}
                </Tag>
            );
        }
        if (block.type === 'ul') {
            return (
                <ul key={key} className="ai-chat-md__ul">
                    {block.items.map((item, j) => (
                        <li key={`${key}-${j}`}>
                            {renderInline(item.text, `${key}-${j}`)}
                            {item.children && item.children.length > 0
                                ? renderBlocks(item.children, `${key}-${j}-c`)
                                : null}
                        </li>
                    ))}
                </ul>
            );
        }
        if (block.type === 'ol') {
            return (
                <ol key={key} className="ai-chat-md__ol" start={block.start}>
                    {block.items.map((item, j) => (
                        <li key={`${key}-${j}`} value={item.value}>
                            {renderInline(item.text, `${key}-${j}`)}
                            {item.children && item.children.length > 0
                                ? renderBlocks(item.children, `${key}-${j}-c`)
                                : null}
                        </li>
                    ))}
                </ol>
            );
        }
        return (
            <p key={key} className="ai-chat-md__p">
                {renderInline(block.text, key)}
            </p>
        );
    });
}

export function renderAiChatMarkdown(markdown: string): ReactNode {
    if (!markdown?.trim()) return null;

    const blocks = withSequentialOlNumbers(parseBlocks(markdown));

    return <div className="ai-chat-md">{renderBlocks(blocks, 'blk')}</div>;
}

export function AiChatMarkdown({ text }: { text: string }) {
    return <Fragment>{renderAiChatMarkdown(text)}</Fragment>;
}
