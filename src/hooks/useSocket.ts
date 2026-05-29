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
    const { emails, setEmails, boxName, addNewEmail, updateEmail, deleteEmail } = useMailData();

    // Keep refs so the stable handlers always read the latest values
    // without needing to re-register on every render
    const emailsRef    = useRef(emails);
    const boxNameRef   = useRef(boxName);
    const setEmailsRef = useRef(setEmails);
    const addEmailRef  = useRef(addNewEmail);
    const updateRef    = useRef(updateEmail);
    const deleteRef    = useRef(deleteEmail);

    // Sync refs every render — no effect needed, no re-subscription triggered
    emailsRef.current    = emails;
    boxNameRef.current   = boxName;
    setEmailsRef.current = setEmails;
    addEmailRef.current  = addNewEmail;
    updateRef.current    = updateEmail;
    deleteRef.current    = deleteEmail;

    useEffect(() => {
        let cancelled = false;
        let socket: Socket | null = null;

        const handleNewEmail = (emailData: Email) => {
            console.log('handleNewEmail', emailData);

            const currentBox = boxNameRef.current;
            const boxLower = currentBox.toLowerCase().trim();
            // Match only the root Inbox, not sub-folders whose IMAP name starts
            // with "INBOX." (e.g. "INBOX.Sent", "INBOX.Drafts", "INBOX.Trash").
            const isInbox = boxLower === 'inbox' || boxLower.endsWith('/inbox') || boxLower.endsWith('.inbox');
            const isAllMail = boxLower.includes('all mail') || boxLower.includes('allmail');
            const appendToInbox = isInbox || isAllMail;
            if (!appendToInbox) return;

            if (!Array.isArray(emailData.from)) {
                emailData.from = [emailData.from];
            }

            if (emailData.threadId) {
                const existingThread = emailsRef.current.find(
                    e => e.threadId === emailData.threadId
                );

                if (existingThread) {
                    console.log('Found existing thread email, removing old and adding new to top');

                    const updated = {
                        ...emailData,
                        flags: emailData.flags?.filter(f => f !== '\\Seen') ?? [],
                        threadCount: (existingThread.threadCount ?? 0) + 1,
                    };

                    setEmailsRef.current((prev: Email[]) => [
                        updated,
                        ...prev.filter(e => e.messageId !== existingThread.messageId),
                    ]);

                    notificationManager.showNewEmailNotification(updated);
                    console.log('emails after thread update', emailsRef.current);
                    return;
                }
            }

            addEmailRef.current(emailData);
            notificationManager.showNewEmailNotification(emailData);
            console.log('emails', emailsRef.current);
        };

        const handleEmailUpdated = (data: Partial<Email> & { messageId: string }) => {
            console.log('handleEmailUpdated', data);
            if (!data.messageId) return;
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
                s.on('newEmail',      handleNewEmail);
                s.on('emailUpdated',  handleEmailUpdated);
                s.on('emailDeleted',  handleEmailDeleted);
                s.on('threadReply',   handleThreadReply);
            } catch (err) {
                console.error('Mail socket init error', err);
            }
        };

        init();

        return () => {
            cancelled = true;
            if (socket) {
                // Pass exact handler references so only THIS hook's listeners are removed
                socket.off('newEmail',      handleNewEmail);
                socket.off('emailUpdated',  handleEmailUpdated);
                socket.off('emailDeleted',  handleEmailDeleted);
                socket.off('threadReply',   handleThreadReply);
            }
        };
    }, []); // empty array — runs once on mount, cleans up on unmount
};
