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
        // A reply to an existing thread updates its root row (increment count + move to top)
        // so it groups immediately instead of appearing as a standalone email.
        const ingestInboundEmails = (rawEmails: Email[]) => {
            const boxLower = boxNameRef.current.toLowerCase().trim();
            const isInbox = boxLower === 'inbox' || boxLower.endsWith('/inbox') || boxLower.endsWith('.inbox');
            const isAllMail = boxLower.includes('all mail') || boxLower.includes('allmail');
            if (!isInbox && !isAllMail) return;

            // Normalise + deduplicate against current state
            const incoming = (rawEmails ?? [])
                .map(e => ({ ...e, from: Array.isArray(e.from) ? e.from : [e.from] }))
                .filter(e => e?.messageId && !emailsRef.current.some(ex => ex.messageId === e.messageId));

            if (!incoming.length) return;

            const currentPagination = paginationRef.current;

            if (currentPagination) {
                setPagination({
                    ...currentPagination,
                    totalEmails: currentPagination.totalEmails + incoming.length,
                    endCount: currentPagination.endCount + incoming.length
                });
            }

            const addedUnreadCount = incoming.filter(e => !e.isSeen).length;
            updateBoxCount(boxNameRef.current, addedUnreadCount, incoming.length);

            // Single setState call — one re-render for the whole batch
            setEmailsRef.current((prev: Email[]) => {
                let next = [...prev];

                for (const email of incoming) {
                    // Idempotency guard: skip if this message is already in the list
                    // (protects against the same reply arriving on two socket events).
                    if (next.some(e => e.messageId === email.messageId)) continue;

                    if (email.threadId) {
                        const idx = next.findIndex(e => e.threadId === email.threadId);
                        if (idx !== -1) {
                            const existing = next[idx];
                            // Trust an authoritative count from the backend; otherwise
                            // increment the existing row so the thread groups immediately.
                            const nextCount =
                                (email.threadCount && email.threadCount > 1)
                                    ? email.threadCount
                                    : (existing.threadCount ?? 1) + 1;

                            // Keep the existing list-row identity (messageId/uid) so opening
                            // still loads the thread root first. Keep the root subject as the
                            // list title; refresh sender/date/count from the newest reply.
                            const updated = {
                                ...existing,
                                from: email.from,
                                subject: existing.subject,
                                date: email.date || existing.date,
                                relativeDate: email.relativeDate ?? existing.relativeDate,
                                attachments: email.attachments ?? existing.attachments,
                                remainingAttachments:
                                    email.remainingAttachments ?? existing.remainingAttachments,
                                flags: email.flags?.filter(f => f !== '\\Seen') ?? [],
                                isSeen: false,
                                threadCount: nextCount,
                            };
                            next.splice(idx, 1);
                            next = [updated, ...next];
                            notificationManager.showNewEmailNotification({
                                ...updated,
                                // Prefer the new reply's identity for the desktop notification
                                messageId: email.messageId || updated.messageId,
                                from: email.from,
                                subject: email.subject || updated.subject,
                            });
                            continue;
                        }
                    }
                    next = [email, ...next];
                    notificationManager.showNewEmailNotification(email);
                }

                return next;
            });
        };

        const handleNewEmail = (payload: { emails: Email[]; unreadCount: number; totalCount: number; boxName: string }) => {
            console.log('handleNewEmail', payload);
            ingestInboundEmails(payload?.emails ?? []);
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
            const emails: Email[] = Array.isArray(data)
                ? data
                : ((data as { emails?: Email[] })?.emails ?? (data ? [data as Email] : []));
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
