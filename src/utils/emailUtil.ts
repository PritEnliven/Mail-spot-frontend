import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import inboxIconActive from '@images/inbox-icon-active.svg';
import inboxIcon from '@images/inbox-icon.svg';
import { getSingleEmailService, type GetSingleEmailPayload } from "@services/email/emailService";
import {
    MAX_CUSTOM_FOLDER_DEPTH,
    MAX_CUSTOM_FOLDER_LEVELS,
    NO_PARENT_FOLDER_VALUE,
} from "../constants/customFolder";
import sidebarConfig from "../config/sidebar.config";
import type { BoxCount } from "../context/MailDataContext";

interface ParsedEmailAddress {
    name: string;
    email: string;
    initial: string;
}

/** API may return RFC strings or structured mailbox objects (e.g. name, email, address). */
export function mailboxParticipantToString(participant: unknown): string {
    if (participant == null) return '';
    if (typeof participant === 'string') {
        return participant.replace(/['"]+/g, '').trim();
    }
    if (typeof participant !== 'object') return String(participant);
    const o = participant as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const emailVal = typeof o.email === 'string' ? o.email.trim() : '';
    const address = typeof o.address === 'string' ? o.address.trim() : '';
    const addr = emailVal || address;
    if (name && addr) return `${name} <${addr}>`;
    return addr || name;
}

/**
 * Display label for list UIs: prefer display name, fall back to email.
 * Supports legacy string payloads and `{ email, name }` objects.
 */
export function getSenderLabel(from: unknown): string {
    const first = Array.isArray(from) ? from[0] : from;
    if (first == null || first === '') return '';
    if (typeof first === 'string') {
        return first.replace(/['"]+/g, '').trim();
    }
    if (typeof first === 'object') {
        const o = first as Record<string, unknown>;
        const name = typeof o.name === 'string' ? o.name.trim() : '';
        const emailVal = typeof o.email === 'string' ? o.email.trim() : '';
        const address = typeof o.address === 'string' ? o.address.trim() : '';
        return name || emailVal || address || '';
    }
    return String(first);
}

/** Comma-separated display labels for to/cc/bcc-style lists. */
export function getParticipantsLabel(participants: unknown): string {
    if (participants == null) return '';
    const list = Array.isArray(participants) ? participants : [participants];
    return list
        .map((p) => getSenderLabel(p))
        .filter((s) => s.length > 0)
        .join(', ');
}

export function normalizeMailboxList(
    participants: unknown[] | undefined | null
): string[] {
    if (!participants || !Array.isArray(participants)) return [];
    return participants.map(mailboxParticipantToString).filter((s) => s.length > 0);
}

/** One plain address per participant, for compose/reply forms (zod `.email()`). */
export function normalizeMailboxParticipantsToEmails(
    participants: unknown[] | undefined | null
): string[] {
    const out: string[] = [];
    for (const s of normalizeMailboxList(participants)) {
        const { email } = parseEmailAddress(s);
        const trimmed = email.trim();
        if (trimmed.includes('@')) {
            out.push(trimmed);
        }
    }
    return out;
}

/**
 * Thread id for reply/send APIs. JS `null` in FormData becomes the string "null";
 * some APIs also return the literal "null" when threading is absent.
 * Falls back to `messageId` so the server still has a stable id for the message being replied to.
 */
export function resolveThreadIdForReply(threadId: unknown, messageId: string): string {
    const sanitized = (v: unknown): string | undefined => {
        if (v == null) return undefined;
        if (typeof v === 'number' && Number.isFinite(v)) return String(v);
        if (typeof v !== 'string') return undefined;
        const t = v.trim();
        if (!t) return undefined;
        const lower = t.toLowerCase();
        if (lower === 'null' || lower === 'undefined') return undefined;
        return t;
    };
    return sanitized(threadId) ?? sanitized(messageId) ?? messageId.trim();
}

type DeleteEmailResponse = {
    statusCode: number;
    [key: string]: any;
};

type DeleteEmailOptions = {
    deleteFn: (messageIds: string[], isDraftEmail: boolean) => Promise<DeleteEmailResponse>;
    successMessage?: string;
    errorMessage?: string;
};

function getBoxNameFromSidebar(sidebarState: any, boxName: string): string {
    const box = sidebarState.boxes.find((box: any) => box.key?.toLowerCase().includes(boxName));
    return box.value || box.label;
}

function verifyBoxName(boxName: string, boxValue: string) {
    if (!boxName || !boxValue) return false;
    const normalized = normalizeBoxName(boxName).toLowerCase();
    const lastSegment = normalized.split(/[./\\]/).pop() ?? normalized;
    return lastSegment.includes(boxValue.toLowerCase());
}

function normalizeBoxName(boxName: string): string {
    if (!boxName) return '';

    // Decode URI components to handle spaces and special characters
    const decoded = decodeURIComponent(boxName);

    // Remove any leading/trailing slashes and normalize
    return decoded.replace(/^\/+|\/+$/g, '');
}

function parseEmailAddress(email?: any): ParsedEmailAddress {

    if (email && typeof email === 'object') {
        const trimEmail = email.email?.trim() || '';
        const name = email.name?.trim() || trimEmail.split('@')[0] || 'Unknown';
        return {
            name,
            email,
            initial: name.charAt(0).toUpperCase(),
        };
    }

    if (!email) {
        return {
            name: 'Unknown',
            email: '',
            initial: 'U',
        };
    }

    // Remove quotes and trim whitespace
    const cleaned = email.replace(/['"]+/g, '').trim();

    // Match: "Name <email@example.com>"
    const angleBracketMatch = cleaned.match(/^(.*?)\s*<([^<>]+)>$/);
    if (angleBracketMatch) {
        const name = angleBracketMatch[1].trim() || angleBracketMatch[2];
        const emailAddr = angleBracketMatch[2].trim();

        return {
            name,
            email: emailAddr,
            initial: name.charAt(0).toUpperCase(),
        };
    }

    // If it's a plain email address
    if (cleaned.includes('@')) {
        const name = cleaned.split('@')[0];

        return {
            name,
            email: cleaned,
            initial: name.charAt(0).toUpperCase(),
        };
    }

    // Fallback: only a name (e.g. "Mail Delivery Subsystem")
    const name = cleaned;

    return {
        name,
        email: '',
        initial: name.charAt(0).toUpperCase(),
    };
}

function getAttachmentIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();

    // Define file type to icon mapping
    const iconMap: Record<string, string> = {
        // Document formats
        pdf: 'pdf',
        doc: 'doc', docx: 'doc', odt: 'doc',
        xls: 'xls', xlsx: 'xls', csv: 'xls', ods: 'xls',
        ppt: 'ppt', pptx: 'ppt', odp: 'ppt',
        txt: 'doc', rtf: 'doc',

        // Archive formats
        zip: 'zip', rar: 'zip', '7z': 'zip', tar: 'zip', gz: 'zip',

        // Image formats
        jpg: 'no', jpeg: 'no', png: 'no', gif: 'no',
        bmp: 'no', svg: 'svg', webp: 'no', ico: 'no',

        // Video formats
        mp4: 'video', avi: 'video', mov: 'video', wmv: 'video',
        mkv: 'video', webm: 'video', flv: 'video',

        // Audio formats
        mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',

        // Code formats
        js: 'code', jsx: 'code', ts: 'code', tsx: 'code',
        html: 'html', htm: 'html',
        css: 'code', scss: 'code', sass: 'code', less: 'code',
        json: 'code', yml: 'code', yaml: 'code',

        // Other
        eml: 'eml', ics: 'code', vcf: 'code',
        exe: 'code', dmg: 'code', iso: 'code',

        // Default
        default: 'no'
    };

    // Get the icon name or default to 'no-image'
    const iconName = iconMap[extension || ''] || iconMap.default;
    return `images/${iconName}-image.png`;
}

const getCustomBoxImap = (box: any): string =>
    typeof box.value === "object" ? box.value.value : box.value;

const getCustomBoxParentImap = (box: any): string | undefined =>
    typeof box.value === "object" ? box.value.parentBox : undefined;

interface CustomFolderTreeNode {
    box: any;
    children: CustomFolderTreeNode[];
}

const buildCustomBoxTree = (customBoxes: any[]): {
    nodeMap: Map<string, CustomFolderTreeNode>;
    roots: CustomFolderTreeNode[];
} => {
    const nodeMap = new Map<string, CustomFolderTreeNode>();
    customBoxes.forEach((box) => {
        nodeMap.set(getCustomBoxImap(box), { box, children: [] });
    });

    const roots: CustomFolderTreeNode[] = [];
    customBoxes.forEach((box) => {
        const imap = getCustomBoxImap(box);
        const parentImap = getCustomBoxParentImap(box);
        const node = nodeMap.get(imap)!;

        if (parentImap && nodeMap.has(parentImap)) {
            nodeMap.get(parentImap)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return { nodeMap, roots };
};

/** Max depth of descendants relative to the node (0 = leaf). */
const getRelativeSubtreeHeight = (node: CustomFolderTreeNode): number => {
    if (node.children.length === 0) return 0;
    return 1 + Math.max(...node.children.map(getRelativeSubtreeHeight));
};

const collectDescendantImaps = (node: CustomFolderTreeNode, into: Set<string>) => {
    node.children.forEach((child) => {
        into.add(getCustomBoxImap(child.box));
        collectDescendantImaps(child, into);
    });
};

/**
 * Whether placing a folder (optionally with an existing subtree) under this parent
 * would stay within MAX_CUSTOM_FOLDER_DEPTH.
 * parentDepth: -1 means no parent (new root at depth 0).
 */
const wouldExceedCustomFolderDepth = (
    parentDepth: number,
    relativeSubtreeHeight = 0
): boolean => parentDepth + 1 + relativeSubtreeHeight > MAX_CUSTOM_FOLDER_DEPTH;

const buildParentFolderOptions = (
    _boxes: any[],
    customBoxes: any[],
    /** IMAP path of the folder being edited (excluded with its descendants). */
    excludeBoxImap?: string
) => {
    const { nodeMap: fullNodeMap } = buildCustomBoxTree(customBoxes);

    const excludedImaps = new Set<string>();
    let relativeSubtreeHeight = 0;

    if (excludeBoxImap) {
        const editNode = fullNodeMap.get(excludeBoxImap);
        if (editNode) {
            excludedImaps.add(excludeBoxImap);
            collectDescendantImaps(editNode, excludedImaps);
            relativeSubtreeHeight = getRelativeSubtreeHeight(editNode);
        }
    }

    const filteredCustomBoxes = excludedImaps.size
        ? customBoxes.filter((box) => !excludedImaps.has(getCustomBoxImap(box)))
        : customBoxes;

    const { roots } = buildCustomBoxTree(filteredCustomBoxes);

    const options: any[] = [];
    options.push({
        label: "Select a folder",
        value: NO_PARENT_FOLDER_VALUE,
        depth: -1,
        isDisabled: wouldExceedCustomFolderDepth(-1, relativeSubtreeHeight),
    });

    const flatten = (nodes: CustomFolderTreeNode[], depth: number) => {
        nodes.forEach((node) => {
            const imap = getCustomBoxImap(node.box);
            const exceeds = wouldExceedCustomFolderDepth(depth, relativeSubtreeHeight);
            options.push({
                label: exceeds
                    ? `${node.box.key} (max ${MAX_CUSTOM_FOLDER_LEVELS} levels)`
                    : node.box.key,
                value: imap,
                depth,
                isDisabled: exceeds,
            });
            flatten(node.children, depth + 1);
        });
    };

    flatten(roots, 0);
    return options;
};

/** Resolve parent depth for validation (-1 = no parent / root). */
const getParentFolderDepth = (
    parentFolder: string | undefined,
    parentFolderOptions: { value: string; depth?: number }[]
): number => {
    if (!parentFolder || parentFolder === NO_PARENT_FOLDER_VALUE) return -1;
    const match = parentFolderOptions.find((opt) => opt.value === parentFolder);
    return match?.depth ?? -1;
};

/**
 * Uses options built by buildParentFolderOptions (including isDisabled / subtree height on edit).
 */
const isCustomFolderDepthAllowed = (
    parentFolder: string | undefined,
    parentFolderOptions: { value: string; depth?: number; isDisabled?: boolean }[]
): boolean => {
    const value = parentFolder || NO_PARENT_FOLDER_VALUE;
    const match = parentFolderOptions.find((opt) => opt.value === value);
    if (!match) {
        return !wouldExceedCustomFolderDepth(getParentFolderDepth(parentFolder, parentFolderOptions));
    }
    return !match.isDisabled;
};

function resolveSidebarItem(box: any, category: 'boxes' | 'customBoxes' | 'otherMenu', boxCounts: Record<string, BoxCount>): any {
    const key = box.key.toLowerCase();

    const matched = sidebarConfig.menuItems.find(
        (item: any) => key.includes(item.id.toLowerCase())
    );

    // Use dynamic count from context if available, otherwise use API count
    const dynamicCount = boxCounts[box.value];
    const unreadCount = dynamicCount ? dynamicCount.unreadCount : box.count;

    let finalBoxObject: any = {
        id: matched?.id ?? key,
        boxName: box.value,
        label: matched?.label ?? box.key,
        icon: matched?.originalIcon ?? inboxIcon,
        activeIcon: matched?.activeIcon ?? inboxIconActive,
        boxKey: box.key,
        unreadCount,
        category,
    }

    if (category === 'customBoxes') {
        finalBoxObject.label = box.value.name,
            finalBoxObject.color = box.value.color,
            finalBoxObject.parentBox = box.value.parentBox
        finalBoxObject.boxName = box.value.value
    }

    return finalBoxObject
}

// Add this function in emailUtil.ts, after the existing resolveSidebarItem function
const resolveAllSidebarItems = (
    boxes: any[],
    customBoxes: any[],
    otherMenu: any[],
    boxCounts: Record<string, BoxCount>
) => {
    return [
        ...boxes.map((box) => resolveSidebarItem(box, 'boxes', boxCounts)),
        ...customBoxes.map((box) => resolveSidebarItem(box, 'customBoxes', boxCounts)),
        ...otherMenu.map((box) => resolveSidebarItem(box, 'otherMenu', boxCounts)),
    ];
};

const handleEmailDeletion = async (
    messageIds: string[],
    isDraftEmail: boolean,
    options: DeleteEmailOptions
): Promise<boolean> => {
    const {
        deleteFn,
        successMessage = 'Email deleted successfully',
        errorMessage = 'Failed to delete email'
    } = options;

    try {
        const response = await deleteFn(messageIds, isDraftEmail);

        if (response.statusCode === 200) {
            showSuccess(successMessage);
            return true;
        }

        showError(errorMessage);
        return false;
    } catch (error) {
        console.error('Error deleting email:', error);
        showError(errorMessage);
        throw error;
    }
};

const openEmailDetail = async (
    currentActiveBox: string,
    uid: number,
    messageId: string,
    isSearch: boolean,
    mongoId?: string
) => {
    const payload: GetSingleEmailPayload = {
        current_active_box: currentActiveBox,
        isSearch,
    };
    if (mongoId) {
        payload.id = mongoId;
    }
    if (messageId) {
        payload.messageId = messageId;
    }
    if (uid !== undefined && uid !== null) {
        payload.uid = uid;
    }

    const data = await getSingleEmailService(payload);
    if (data.isScheduled) {
        data.emailList.isSchedule = true;
    }
    return data.emailList;
}

// Takes already-resolved sidebar items for customBoxes (each has boxName = IMAP path, parentBox = parent IMAP path)
// Returns them flattened in depth-first tree order with a `depth` field added.
const buildCustomFolderTree = (customBoxItems: any[]): any[] => {
    interface TreeNode { item: any; children: TreeNode[]; }

    const nodeMap = new Map<string, TreeNode>();
    customBoxItems.forEach(item => {
        nodeMap.set(item.boxName, { item, children: [] });
    });

    const roots: TreeNode[] = [];
    customBoxItems.forEach(item => {
        const node = nodeMap.get(item.boxName)!;
        if (item.parentBox && nodeMap.has(item.parentBox)) {
            nodeMap.get(item.parentBox)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    const result: any[] = [];
    const flatten = (nodes: TreeNode[], depth: number) => {
        nodes.forEach(node => {
            result.push({ ...node.item, depth });
            flatten(node.children, depth + 1);
        });
    };
    flatten(roots, 0);
    return result;
};

const htmlToPlainText = (html: string): string =>
    html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim();

/** Drop quoted/forwarded tails so list/thread previews show only the newest reply text. */
const stripQuotedTail = (text: string): string => {
    // Normalize unicode dashes so "——— Original Message ———" still matches.
    const normalized = text.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-");

    const quoteMarkers = [
        // Leading dashes are enough; trailing side may be broken (e.g. "-f-------").
        /-{2,}\s*Original\s+Message\b/i,
        /-{2,}\s*Forwarded\s+Message\b/i,
        /_{5,}\s*Original\s+Message\b/i,
        /_{5,}/,
        /\bOn\s.+?\bwrote:/i,
        /\bFrom:\s.+\bSent:/i,
        /\bBegin\s+forwarded\s+message\b/i,
    ];

    let cutAt = normalized.length;
    for (const marker of quoteMarkers) {
        const match = marker.exec(normalized);
        if (match?.index != null && match.index < cutAt) {
            cutAt = match.index;
        }
    }

    return normalized.slice(0, cutAt).replace(/\s+/g, " ").trim();
};

/**
 * One-line preview for thread emails: latest body (without quoted tails),
 * falling back to subject when body is empty.
 */
const getEmailPreviewText = (email: {
    bodyText?: string;
    body?: string;
    subject?: string;
}): string => {
    const plain = (email.bodyText || htmlToPlainText(email.body || "")).trim();
    const withoutQuote = stripQuotedTail(plain);
    return withoutQuote || email.subject || "";
};

export { parseEmailAddress, getAttachmentIcon, buildParentFolderOptions, buildCustomFolderTree, resolveSidebarItem, resolveAllSidebarItems, handleEmailDeletion, openEmailDetail, getBoxNameFromSidebar, verifyBoxName, getEmailPreviewText, isCustomFolderDepthAllowed, getParentFolderDepth, wouldExceedCustomFolderDepth };
