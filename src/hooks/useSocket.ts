import { useEffect, useRef } from 'react';
import { getSocket, disconnectSocket } from '@services/socket/socket';
import { useMailData } from '@context/MailDataContext';
import type { Email } from '@models/Email';
import type { Socket } from 'socket.io-client';
import { notificationManager } from '@utils/notifications';
import { useNavigate } from 'react-router-dom';

type EventCallback = (...args: any[]) => void;

export const useSocketEvent = (event: string, callback: EventCallback): void => {
    // Store latest callback in a ref — handler identity stays stable across renders
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        let cancelled = false;
        let socket: Socket | null = null;

        // Stable wrapper — registered once, always calls the latest callback
        const handler: EventCallback = (...args) => callbackRef.current(...args);

        const setup = async () => {
            try {
                const s = await getSocket();
                if (cancelled) return;
                socket = s;
                s.on(event, handler);
            } catch (err) {
                console.error('Socket event error', err);
            }
        };

        setup();

        return () => {
            cancelled = true;
            socket?.off(event, handler);
        };
    }, [event]); // callback intentionally omitted — handled via ref
};

export const useMailSocket = () => {
    const navigate = useNavigate();
    const { emails, setEmails, boxName, pagination, updateEmailReadState, setPagination, updateBoxCount, addNewEmail, updateEmail, deleteEmail, updateEmailAttachment, activeEmailMessageId } = useMailData();
    const emailsRef = useRef(emails);
    const boxNameRef = useRef(boxName);
    const setEmailsRef = useRef(setEmails);
    const addEmailRef = useRef(addNewEmail);
    const updateRef = useRef(updateEmail);
    const deleteRef = useRef(deleteEmail);

    const paginationRef = useRef(pagination);
    const activeEmailMessageIdRef = useRef(activeEmailMessageId);
    const updateEmailAttachmentRef = useRef(updateEmailAttachment);

    activeEmailMessageIdRef.current = activeEmailMessageId;
    updateEmailAttachmentRef.current = updateEmailAttachment;

    useEffect(() => {
        paginationRef.current = pagination;
    }, [pagination]);

    // Sync refs every render — no effect needed, no re-subscription triggered
    emailsRef.current = emails;
    boxNameRef.current = boxName;
    setEmailsRef.current = setEmails;
    addEmailRef.current = addNewEmail;
    updateRef.current = updateEmail;
    deleteRef.current = deleteEmail;

    const updateEmailReadStateRef = useRef(updateEmailReadState);
    updateEmailReadStateRef.current = updateEmailReadState;

    useEffect(() => {
        let cancelled = false;
        let socket: Socket | null = null;
        // Shared ingest for inbound mail — used by both 'newEmail' and 'threadReply'.
        // Upsert by messageId (root-shaped payload) or threadId (reply-shaped), then move
        // the row to top. Only prepend when the thread isn't already on the list.
        const ingestInboundEmails = (rawEmails: Email[]) => {
            const boxLower = boxNameRef.current.toLowerCase().trim();
            const isInbox = boxLower === 'inbox' || boxLower.endsWith('/inbox') || boxLower.endsWith('.inbox');
            const isAllMail = boxLower.includes('all mail') || boxLower.includes('allmail');
            if (!isInbox && !isAllMail) return;

            const seenInBatch = new Set<string>();
            const incoming = (rawEmails ?? [])
                .map(e => ({ ...e, from: Array.isArray(e.from) ? e.from : [e.from] }))
                .filter(e => {
                    if (!e?.messageId || seenInBatch.has(e.messageId)) return false;
                    seenInBatch.add(e.messageId);
                    return true;
                });

            if (!incoming.length) return;

            let next = [...emailsRef.current];
            let addedRows = 0;
            let unreadDelta = 0;
            const notifications: Email[] = [];

            for (const email of incoming) {
                const byMessageId = next.findIndex(e => e.messageId === email.messageId);
                const byThreadId =
                    byMessageId === -1 && email.threadId
                        ? next.findIndex(e => e.threadId === email.threadId)
                        : -1;
                const idx = byMessageId !== -1 ? byMessageId : byThreadId;

                if (idx !== -1) {
                    const existing = next[idx];
                    const existingCount = existing.threadCount ?? 1;
                    // Prefer authoritative backend count; for reply-shaped payloads
                    // (new messageId into an existing thread) bump when count is missing.
                    let nextCount = existingCount;
                    if (typeof email.threadCount === 'number' && email.threadCount > existingCount) {
                        nextCount = email.threadCount;
                    } else if (byMessageId === -1) {
                        nextCount = existingCount + 1;
                    }

                    if (existing.isSeen) unreadDelta += 1;

                    // Keep list-row identity (messageId/uid) so opening still loads the
                    // thread root. Keep root subject; refresh sender/date/count from newest.
                    const updated: Email = {
                        ...existing,
                        from: email.from ?? existing.from,
                        subject: byMessageId !== -1
                            ? (email.subject || existing.subject)
                            : existing.subject,
                        date: email.date || existing.date,
                        relativeDate: email.relativeDate ?? existing.relativeDate,
                        attachments: email.attachments ?? existing.attachments,
                        remainingAttachments:
                            email.remainingAttachments ?? existing.remainingAttachments,
                        flags: email.flags?.filter(f => f !== '\\Seen') ?? existing.flags ?? [],
                        isSeen: false,
                        threadCount: nextCount,
                        threadId: email.threadId || existing.threadId,
                    };
                    next.splice(idx, 1);
                    next = [updated, ...next];
                    notifications.push({
                        ...updated,
                        messageId: email.messageId || updated.messageId,
                        from: email.from,
                        subject: email.subject || updated.subject,
                    });
                    continue;
                }

                addedRows += 1;
                if (!email.isSeen) unreadDelta += 1;
                next = [email, ...next];
                notifications.push(email);
            }

            if (addedRows > 0) {
                const currentPagination = paginationRef.current;
                if (currentPagination) {
                    setPagination({
                        ...currentPagination,
                        totalEmails: currentPagination.totalEmails + addedRows,
                        endCount: currentPagination.endCount + addedRows
                    });
                }
            }
            if (unreadDelta !== 0 || addedRows > 0) {
                updateBoxCount(boxNameRef.current, unreadDelta, addedRows);
            }

            emailsRef.current = next;
            setEmailsRef.current(next);
            notifications.forEach(e => notificationManager.showNewEmailNotification(e));
        };

        const handleNewEmail = (payload: { emails: Email[]; unreadCount: number; totalCount: number; boxName: string }) => {
            console.log('handleNewEmail', payload);
            const incoming = payload?.emails ?? [];
            const payloadBox = payload?.boxName;
            if (!incoming.length) return;

            const payloadBoxLower = (payloadBox || '').toLowerCase().trim();
            const isInboxPayload =
                payloadBoxLower === 'inbox' ||
                payloadBoxLower.endsWith('/inbox') ||
                payloadBoxLower.endsWith('.inbox');
            const isAllMailPayload =
                payloadBoxLower.includes('all mail') || payloadBoxLower.includes('allmail');
                
            const isSentPayload = payloadBoxLower.includes('sent');

            // Inbox / All Mail — existing thread-aware ingest
            if (!payloadBox || isInboxPayload || isAllMailPayload) {
                ingestInboundEmails(incoming);
                return;
            }

            // Sent (and other non-inbox boxes): always bump sidebar count for that box
            const addedUnread = incoming.filter(
                (e) => !e.isSeen && !(Array.isArray(e.flags) && e.flags.includes('\\Seen'))
            ).length;

            updateBoxCount(payloadBox, addedUnread, incoming.length);

            const currentBoxLower = boxNameRef.current.toLowerCase().trim();

            const viewingThisBox =
                currentBoxLower === payloadBoxLower ||
                (isSentPayload && currentBoxLower.includes('sent'));

            if (!viewingThisBox) return;

            const normalized = incoming
                .map((e) => ({
                    ...e,
                    from: Array.isArray(e.from) ? e.from : [e.from],
                    to: Array.isArray(e.to) ? e.to : e.to ? [e.to] : [],
                    isSeen: true,
                    flags: Array.isArray(e.flags) && e.flags.length ? e.flags : ['\\Seen'],
                }))
                .filter(
                    (e) =>
                        e?.messageId &&
                        !emailsRef.current.some((ex) => ex.messageId === e.messageId)
                );

            if (!normalized.length) return;

            const currentPagination = paginationRef.current;
            if (currentPagination) {
                setPagination({
                    ...currentPagination,
                    totalEmails: currentPagination.totalEmails + normalized.length,
                    endCount: currentPagination.endCount + normalized.length,
                });
            }

            setEmailsRef.current((prev: Email[]) => {
                let next = [...prev];
                for (const email of normalized) {
                    if (next.some((e) => e.messageId === email.messageId)) continue;
                    next = [email, ...next];
                }
                return next;
            });
        };

        const handleEmailUpdated = (data: Partial<Email> & { messageId: string }) => {
            console.log('handleEmailUpdated', data);
            if (!data.messageId) return;

            if (typeof data.isSeen === 'boolean') {
                updateEmailReadStateRef.current([data.messageId], data.isSeen);
                return;
            }

            updateRef.current(data as Email);
        };

        const handleEmailDeleted = (data: Email | Email[]) => {
            console.log('handleEmailDeleted', data);
            if (Array.isArray(data)) {
                data.forEach(e => deleteRef.current(e.messageId));
            } else {
                deleteRef.current(data.messageId);
            }
        };

        const handleThreadReply = (data: Email | Email[] | { emails?: Email[] }) => {
            console.log('Thread has received:', data);
            // Normalise the various payload shapes a backend might use for a reply,
            // then reuse the same list-ingestion path as 'newEmail'. The messageId
            // dedupe + idempotency guard keep the count correct if both events fire.
            const emails: Email[] = Array.isArray(data)? data : ((data as { emails?: Email[] })?.emails ?? (data ? [data as Email] : []));
            ingestInboundEmails(emails);
        };

        const handleAttachmentDownload = (data: any) => {
            console.log('Attachment downloaded', data);
            if (activeEmailMessageIdRef.current === data.messageId) {
                updateEmailAttachmentRef.current(data.messageId, data.attachment);
            }
        };

        const handleLogout = () => {
            localStorage.clear();
            disconnectSocket();
            navigate('/login');
        };

        const init = async () => {
            try {
                const s = await getSocket();
                // Guard: effect may have been cleaned up while awaiting the socket
                if (cancelled) return;

                socket = s;
                s.on('newEmail', handleNewEmail);
                s.on('emailUpdated', handleEmailUpdated);
                s.on('emailDeleted', handleEmailDeleted);
                s.on('threadReply', handleThreadReply);
                s.on('attachment:downloaded', handleAttachmentDownload);
                s.on('logout', handleLogout);
            } catch (err) {
                console.error('Mail socket init error', err);
            }
        };

        init();

        return () => {
            cancelled = true;
            if (socket) {
                // Pass exact handler references so only THIS hook's listeners are removed
                socket.off('newEmail', handleNewEmail);
                socket.off('emailUpdated', handleEmailUpdated);
                socket.off('emailDeleted', handleEmailDeleted);
                socket.off('threadReply', handleThreadReply);
                socket.off('attachment:downloaded', handleAttachmentDownload);
                socket.off('logout', handleLogout);
            }
        };
    }, []); // empty array — runs once on mount, cleans up on unmount
};




