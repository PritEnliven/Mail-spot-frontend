import type { AttachmentItem } from '@hooks/useAttachmentManager';
import { isExistingAttachment } from '@hooks/useAttachmentManager';

/** Collect original names used by inline body images (data-filename). */
export function collectInlineImageFilenames(html: string): Set<string> {
    const names = new Set<string>();
    if (!html) return names;

    const re = /data-filename\s*=\s*["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
        const name = match[1]?.trim();
        if (name) names.add(name.toLowerCase());
    }
    return names;
}

function splitName(name: string): { base: string; ext: string } {
    const i = name.lastIndexOf('.');
    if (i <= 0) return { base: name, ext: '' };
    return { base: name.slice(0, i), ext: name.slice(i) };
}

/** Rename File so it does not collide with reserved names (inline images / other attachments). */
export function uniquifyAttachmentFile(
    file: File,
    reservedNames: Set<string>
): File {
    const original = file.name;
    let candidate = original;
    let n = 1;

    while (reservedNames.has(candidate.toLowerCase())) {
        const { base, ext } = splitName(original);
        candidate = `${base} (${n})${ext}`;
        n += 1;
    }

    reservedNames.add(candidate.toLowerCase());

    if (candidate === original) return file;
    return new File([file], candidate, {
        type: file.type,
        lastModified: file.lastModified,
    });
}

/**
 * When appending attachments, rename Files that share a name with body images
 * (or with each other) so backend storage/CID keyed by filename won't collide.
 */
export function prepareUniqueAttachmentFiles(
    html: string,
    attachments: AttachmentItem[]
): AttachmentItem[] {
    const reserved = collectInlineImageFilenames(html);

    for (const item of attachments) {
        if (isExistingAttachment(item) && item.name) {
            reserved.add(item.name.toLowerCase());
        }
    }

    return attachments.map((item) => {
        if (item instanceof File) {
            return uniquifyAttachmentFile(item, reserved);
        }
        return item;
    });
}
