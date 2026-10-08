import { dismissToast } from '@components/ui/toast/toastNotification';

export interface PendingOutboundSend {
    clientMessageId: string;
    /** Progress toast id for "Trying…" while SMTP is in flight */
    toastId?: string | number;
    accountId?: string;
    accountEmail?: string;
}

const pendingByClientId = new Map<string, PendingOutboundSend>();

export function registerPendingOutboundSend(entry: PendingOutboundSend) {
    const id = entry.clientMessageId?.trim();
    if (!id) return;
    const existing = pendingByClientId.get(id);
    if (existing?.toastId != null && existing.toastId !== entry.toastId) {
        dismissToast(existing.toastId);
    }
    pendingByClientId.set(id, { ...existing, ...entry, clientMessageId: id });
}

/** Stops "Trying…" and removes the pending entry. Returns metadata if found. */
export function resolvePendingOutboundSend(clientMessageId?: string | null): PendingOutboundSend | null {
    const id = clientMessageId?.trim();
    if (!id) return null;
    const entry = pendingByClientId.get(id);
    if (!entry) return null;
    pendingByClientId.delete(id);
    if (entry.toastId != null) {
        dismissToast(entry.toastId);
    }
    return entry;
}

export function getPendingOutboundSend(clientMessageId?: string | null): PendingOutboundSend | null {
    const id = clientMessageId?.trim();
    if (!id) return null;
    return pendingByClientId.get(id) ?? null;
}
