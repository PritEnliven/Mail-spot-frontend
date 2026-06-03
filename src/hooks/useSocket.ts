import { useEffect, useRef } from 'react';
import { getSocket } from '@services/socket/socket';
import { useMailData } from '@context/MailDataContext';
import type { Email } from '@models/Email';
import type { Socket } from 'socket.io-client';
import { notificationManager } from '@utils/notifications';

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
    const { emails, setEmails, boxName, pagination, updateEmailReadState, setPagination, updateBoxCount, addNewEmail, updateEmail, deleteEmail } = useMailData();

    // Keep refs so the stable handlers always read the latest values
    // without needing to re-register on every render
    const emailsRef = useRef(emails);
    const boxNameRef = useRef(boxName);
    const setEmailsRef = useRef(setEmails);
    const addEmailRef = useRef(addNewEmail);
    const updateRef = useRef(updateEmail);
    const deleteRef = useRef(deleteEmail);

    const paginationRef = useRef(pagination);
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
        const handleNewEmail = (payload: { emails: Email[]; unreadCount: number; totalCount: number; boxName: string }) => {
            console.log('handleNewEmail', payload);

            const boxLower = boxNameRef.current.toLowerCase().trim();
            const isInbox = boxLower === 'inbox' || boxLower.endsWith('/inbox') || boxLower.endsWith('.inbox');
            const isAllMail = boxLower.includes('all mail') || boxLower.includes('allmail');
            if (!isInbox && !isAllMail) return;

            // Normalise + deduplicate against current state
            const incoming = (payload.emails ?? [])
                .map(e => ({ ...e, from: Array.isArray(e.from) ? e.from : [e.from] }))
                .filter(e => !emailsRef.current.some(ex => ex.messageId === e.messageId));

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
                    if (email.threadId) {
                        const idx = next.findIndex(e => e.threadId === email.threadId);
                        if (idx !== -1) {
                            const updated = {
                                ...email,
                                flags: email.flags?.filter(f => f !== '\\Seen') ?? [],
                                threadCount: 1,
                            };
                            next.splice(idx, 1);
                            next = [updated, ...next];
                            notificationManager.showNewEmailNotification(updated);
                            continue;
                        }
                    }
                    next = [email, ...next];
                    notificationManager.showNewEmailNotification(email);
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

        const handleThreadReply = (data: Email | Email[]) => {
            console.log('Thread has received:', data);
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
            }
        };
    }, []); // empty array — runs once on mount, cleans up on unmount
};
