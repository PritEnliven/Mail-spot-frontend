import type { Email } from '@models/Email';
import { useMailData } from '@context/MailDataContext';
import { formatDate, TimeFormat } from '@utils/dateUtil';
import { useCallback, useState } from 'react';
import { useContacts } from '../context/index';

export type ReplyForwardType = 'reply' | 'replyAll' | 'forward';

export interface ReplyForwardState {
    isOpen: boolean;
    type: ReplyForwardType | null;
    sourceEmail: Email | null;
    targetId: string | null; // For thread emails, stores the unique identifier
}

type EmailAddress = {
    email: string;
    name?: string;
};

export const useReplyForward = () => {
    const { fetchContacts } = useContacts();
    const { refreshUserPermissions } = useMailData();
    const [replyForwardState, setReplyForwardState] = useState<ReplyForwardState>({
        isOpen: false,
        type: null,
        sourceEmail: null,
        targetId: null
    });

    const openReplyForward = useCallback((
        type: ReplyForwardType,
        email: Email,
        targetId?: string
    ) => {
        fetchContacts();
        void refreshUserPermissions();
        setReplyForwardState({
            isOpen: true,
            type,
            sourceEmail: email,
            targetId: targetId || null
        });

        // Auto-scroll to the target element if provided
        if (targetId) {
            setTimeout(() => {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [fetchContacts, refreshUserPermissions]);

    const closeReplyForward = useCallback(() => {
        setReplyForwardState({
            isOpen: false,
            type: null,
            sourceEmail: null,
            targetId: null
        });
    }, []);

    const getRecipients = useCallback((type: ReplyForwardType, email: Email) => {
        const currentUserEmail = (localStorage.getItem('email') || '').toLowerCase();

        const extractEmails = (list: EmailAddress[] = []) => list.filter(v => v?.email);

        const unique = (list: EmailAddress[] = []) =>
            Array.from(new Map(list.map(v => [v.email.toLowerCase(), v])).values());

        const withoutCurrentUser = (list: EmailAddress[] = []) => {
            if (!currentUserEmail) return list;
            return list.filter(v => v.email.toLowerCase() !== currentUserEmail);
        };

        const from = extractEmails(email.from || []);
        const to = extractEmails(email.to || []);
        const cc = extractEmails(email.cc || []);
        const bcc = extractEmails(email.bcc || []);

        const fromHasCurrentUser = currentUserEmail ? from.some(v => v.email.toLowerCase() === currentUserEmail) : false;

        switch (type) {
            case 'reply':
                if (fromHasCurrentUser) {
                    return {
                        to: withoutCurrentUser(unique(to)),
                        cc: [],
                        bcc: []
                    };
                }

                return {
                    to: withoutCurrentUser(unique(from)),
                    cc: [],
                    bcc: []
                };

            case 'replyAll':
                return {
                    to: withoutCurrentUser(unique([...from, ...to])),
                    cc: withoutCurrentUser(unique(cc)),
                    bcc: withoutCurrentUser(unique(bcc))
                };

            case 'forward':
                return {
                    to: [],
                    cc: [],
                    bcc: []
                };

            default:
                return {
                    to: [],
                    cc: [],
                    bcc: []
                };
        }
    }, []);

    const getSubject = useCallback((type: ReplyForwardType, email: Email) => {
        const prefix = type === 'forward' ? 'Fwd: ' : 'Re: ';
        return email.subject.startsWith(prefix) ? email.subject : `${prefix}${email.subject}`;
    }, []);

    const getBody = useCallback((type: ReplyForwardType, email: Email) => {
        const isForward = type === 'forward';

        const from = email.from.map(v => v.email).join(', ');
        const to = email.to.map(v => v.email).join(', ');
        const cc = email.cc?.map(v => v.email).join(', ');

        const containerStyle =
            'background-color:#f9f9f9;padding:15px;border-radius:4px;margin-top:10px;';

        const header = `
                    <br>
                    <div
                        id="${isForward ? 'forwarded-message' : 'quoted-message'}"
                        class="${isForward ? 'forwarded-message' : 'quoted-message'}"
                        style="border-left:2px solid #ccc;padding-left:10px;margin-top:8px;color:#666;font-size:0.9em;"
                    >
                        <div style="font-weight:bold;margin-bottom:10px;">
                            -------- ${isForward ? 'Forwarded' : 'Original'} Message --------
                        </div>
                        <div><strong>From:</strong> ${from}</div>
                        <div><strong>Date:</strong> ${formatDate(email.date, TimeFormat.FORWARD_TIME)}</div>
                        <div><strong>Subject:</strong> ${email.subject}</div>
                        <div><strong>To:</strong> ${to}</div>
                        ${cc ? `<div><strong>CC:</strong> ${cc}</div>` : ''}
                    </div>
                `;

        let content = '[No content]';
        let extraStyle = 'color:#999;';

        if (email.body) {
            content = email.body
                .replace(/<style[^>]*>.*?<\/style>/gis, '')
                .replace(/:root\s*\{[^}]*\}/g, '')
                .replace(/<meta[^>]*>/gi, '')
                .replace(/<link[^>]*>/gi, '');

            extraStyle = '';
        } else if (email.bodyText) {
            content = email.bodyText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

            extraStyle = 'white-space:pre-wrap;font-family:monospace;';
        }

        return `${header}
                    <div class="quoted-content" style="${containerStyle}${extraStyle}">
                        ${content}
                    </div>
                `;
    }, []);

    return {
        replyForwardState,
        openReplyForward,
        closeReplyForward,
        getRecipients,
        getSubject,
        getBody
    };
};
