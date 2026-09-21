export type EmailAttachmentLike = {
    filename?: string;
    fileName?: string;
    name?: string;
    customFileName?: string | null;
    contentType?: string;
    contentId?: string;
    contentID?: string;
    cid?: string;
    content_id?: string;
    contentDisposition?: string;
    disposition?: string;
    isInline?: boolean;
    isSchedule?: boolean;
    size?: number;
    [key: string]: any;
};

/** Strip cid: prefix and angle brackets for matching. */
export function normalizeCid(value: string | null | undefined): string {
    if (!value) return '';
    return value
        .trim()
        .replace(/^cid:/i, '')
        .replace(/^<|>$/g, '')
        .trim()
        .toLowerCase();
}

export function getAttachmentContentId(attachment: EmailAttachmentLike): string {
    return normalizeCid(
        attachment.contentId ||
        attachment.contentID ||
        attachment.cid ||
        attachment.content_id ||
        ''
    );
}

export function getAttachmentFilename(attachment: EmailAttachmentLike): string {
    return attachment.filename || attachment.fileName || attachment.name || '';
}

function getDisposition(attachment: EmailAttachmentLike): string {
    return String(attachment.contentDisposition || attachment.disposition || '').toLowerCase();
}

function isImageAttachment(attachment: EmailAttachmentLike): boolean {
    const contentType = String(attachment.contentType || '').toLowerCase();
    if (contentType.startsWith('image/')) return true;
    const ext = getAttachmentFilename(attachment).split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
}

/** Collect normalized Content-IDs referenced by cid: URLs in HTML. */
export function collectCidReferences(html: string | null | undefined): Set<string> {
    const refs = new Set<string>();
    if (!html) return refs;

    const srcPattern = /(?:src|href)\s*=\s*["']?\s*(cid:[^"'>\s]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = srcPattern.exec(html)) !== null) {
        const cid = normalizeCid(match[1]);
        if (cid) refs.add(cid);
    }

    const cssPattern = /url\(\s*['"]?(cid:[^)'"\s]+)/gi;
    while ((match = cssPattern.exec(html)) !== null) {
        const cid = normalizeCid(match[1]);
        if (cid) refs.add(cid);
    }

    return refs;
}

export function isInlineAttachment(
    attachment: EmailAttachmentLike,
    cidReferences?: Set<string>
): boolean {
    if (attachment.isInline === true) return true;

    const disposition = getDisposition(attachment);
    if (disposition.includes('inline')) return true;
    if (disposition.includes('attachment')) {
        const cid = getAttachmentContentId(attachment);
        return !!(cid && cidReferences?.has(cid));
    }

    const cid = getAttachmentContentId(attachment);
    if (cid && cidReferences?.has(cid)) return true;

    if (cid && isImageAttachment(attachment) && !disposition) return true;

    return false;
}

export function filterNonInlineAttachments<T extends EmailAttachmentLike>(
    attachments: T[] | null | undefined,
    bodyHtml?: string | null
): T[] {
    if (!attachments?.length) return [];
    const cidReferences = collectCidReferences(bodyHtml);
    return attachments.filter((attachment) => !isInlineAttachment(attachment, cidReferences));
}

export function buildAttachmentPreviewUrl(
    attachment: EmailAttachmentLike,
    apiUrl: string = import.meta.env.VITE_API_URL
): string | null {
    const token = localStorage.getItem('token');
    if (!token || !attachment.customFileName) return null;
    const scheduleQuery = attachment.isSchedule ? '?isSchedule=true' : '';
    return `${apiUrl}/preview/${token}/${attachment.customFileName}${scheduleQuery}`;
}

function findAttachmentForCid(
    cid: string,
    attachments: EmailAttachmentLike[],
    usedIndexes: Set<number>
): EmailAttachmentLike | null {
    const normalized = normalizeCid(cid);
    if (!normalized) return null;

    const byContentId = attachments.findIndex((attachment, index) => {
        if (usedIndexes.has(index)) return false;
        return getAttachmentContentId(attachment) === normalized;
    });
    if (byContentId >= 0) {
        usedIndexes.add(byContentId);
        return attachments[byContentId];
    }

    const byFilename = attachments.findIndex((attachment, index) => {
        if (usedIndexes.has(index)) return false;
        if (!isImageAttachment(attachment)) return false;
        const filename = getAttachmentFilename(attachment).toLowerCase();
        return !!filename && normalized.includes(filename);
    });
    if (byFilename >= 0) {
        usedIndexes.add(byFilename);
        return attachments[byFilename];
    }

    const nextImage = attachments.findIndex((attachment, index) => {
        if (usedIndexes.has(index)) return false;
        return isImageAttachment(attachment);
    });
    if (nextImage >= 0) {
        usedIndexes.add(nextImage);
        return attachments[nextImage];
    }

    return null;
}

/**
 * Rewrite cid: image/background URLs in a DOM tree to authenticated preview URLs.
 */
export function resolveCidUrlsInElement(
    root: ParentNode,
    attachments: EmailAttachmentLike[] | null | undefined
): number {
    if (!attachments?.length) return 0;

    const usedIndexes = new Set<number>();
    let resolved = 0;

    const rewriteSrc = (el: Element, attr: 'src' | 'href') => {
        const raw = el.getAttribute(attr);
        if (!raw || !/^cid:/i.test(raw.trim())) return;
        const match = findAttachmentForCid(raw, attachments, usedIndexes);
        const previewUrl = match ? buildAttachmentPreviewUrl(match) : null;
        if (previewUrl) {
            el.setAttribute(attr, previewUrl);
            resolved += 1;
        }
    };

    root.querySelectorAll('img[src]').forEach((img) => rewriteSrc(img, 'src'));
    root.querySelectorAll('a[href^="cid:"], a[href^="CID:"]').forEach((anchor) => {
        rewriteSrc(anchor, 'href');
    });

    root.querySelectorAll('[style*="cid:"], [style*="CID:"], [background*="cid:"], [background*="CID:"]').forEach((el) => {
        const style = el.getAttribute('style');
        if (style && /cid:/i.test(style)) {
            const nextStyle = style.replace(
                /url\(\s*['"]?(cid:[^)'"\s]+)['"]?\s*\)/gi,
                (_full, cidRef: string) => {
                    const match = findAttachmentForCid(cidRef, attachments, usedIndexes);
                    const previewUrl = match ? buildAttachmentPreviewUrl(match) : null;
                    if (!previewUrl) return _full;
                    resolved += 1;
                    return `url("${previewUrl}")`;
                }
            );
            el.setAttribute('style', nextStyle);
        }

        const background = el.getAttribute('background');
        if (background && /^cid:/i.test(background.trim())) {
            const match = findAttachmentForCid(background, attachments, usedIndexes);
            const previewUrl = match ? buildAttachmentPreviewUrl(match) : null;
            if (previewUrl) {
                el.setAttribute('background', previewUrl);
                resolved += 1;
            }
        }
    });

    return resolved;
}