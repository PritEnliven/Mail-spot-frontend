import { useState, useCallback } from 'react';
import type { Email } from '@models/Email';
import { normalizeMailboxList, normalizeMailboxParticipantsToEmails } from '@utils/emailUtil';
import { useContacts } from '../context/index';
import { formatDate, TimeFormat } from '@utils/dateUtil';
import { Time } from 'rrule/dist/esm/datetime';

export type ReplyForwardType = 'reply' | 'replyAll' | 'forward';

export interface ReplyForwardState {
    isOpen: boolean;
    type: ReplyForwardType | null;
    sourceEmail: Email | null;
    targetId: string | null; // For thread emails, stores the unique identifier
}

export const useReplyForward = () => {
    const { fetchContacts } = useContacts();
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
    }, [fetchContacts]);

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
        const normalize = (list: string[] = []) => list.map(v => (v || '').toLowerCase()).filter(Boolean);
        const unique = (list: string[]) => Array.from(new Set(list));
        const withoutCurrentUser = (list: string[]) => {
            if (!currentUserEmail) return list;
            return list.filter(v => v.toLowerCase() !== currentUserEmail);
        };

        const from = normalizeMailboxParticipantsToEmails(email.from);
        const to = normalizeMailboxParticipantsToEmails(email.to);
        const cc = normalizeMailboxParticipantsToEmails(email.cc);
        const bcc = normalizeMailboxParticipantsToEmails(email.bcc);

        const fromHasCurrentUser = currentUserEmail ? normalize(from).includes(currentUserEmail) : false;

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
                return { to: [], cc: [], bcc: [] };
        }
    }, []);

    const getSubject = useCallback((type: ReplyForwardType, email: Email) => {
        const prefix = type === 'forward' ? 'Fwd: ' : 'Re: ';
        return email.subject.startsWith(prefix) ? email.subject : `${prefix}${email.subject}`;
    }, []);

    const getBody = useCallback((type: ReplyForwardType, email: Email) => {
        const isForward = type === 'forward';
        const fromJoined = normalizeMailboxList(email.from).join(', ');
        const toJoined = normalizeMailboxList(email.to).join(', ');
        const ccList = normalizeMailboxList(email.cc);
        const ccJoined = ccList.join(', ');
        const ccBlock =
            ccList.length > 0 ? `<div><strong>CC:</strong> ${ccJoined}</div>` : '';

        // Create the quoted message header
        const header = isForward 
            ? `<div id="forwarded-message" class="forwarded-message" style="border-left: 2px solid #ccc; padding-left: 10px; margin: 20px 0; color: #666; font-size: 0.9em;">` +
              `<div style="font-weight: bold; margin-bottom: 10px;">-------- Forwarded Message --------</div>` +
              `<div><strong>From:</strong> ${fromJoined}</div>` +
              `<div><strong>Date:</strong> ${formatDate(email.date, TimeFormat.FORWARD_TIME)}</div>` +
              `<div><strong>Subject:</strong> ${email.subject}</div>` +
              `<div><strong>To:</strong> ${toJoined}</div>` +
              ccBlock +
              `</div>`
            : `<br><br><div id="quoted-message" class="quoted-message" style="border-left: 2px solid #ccc; padding-left: 10px; margin: 20px 0; color: #666; font-size: 0.9em;">` +
              `<div style="font-weight: bold; margin-bottom: 10px;">-------- Original Message --------</div>` +
              `<div><strong>From:</strong> ${fromJoined}</div>` +
              `<div><strong>Date:</strong> ${formatDate(email.date, TimeFormat.FORWARD_TIME)}</div>` +
              `<div><strong>Subject:</strong> ${email.subject}</div>` +
              `<div><strong>To:</strong> ${toJoined}</div>` +
              ccBlock +
              `</div>`;
        
        let bodyContent: string;
        
        if (email.isBodyHtml && email.body) {
            const cleanedBody = email.body
                .replace(/<style[^>]*>.*?<\/style>/gis, '')
                .replace(/:root\s*\{[^}]*\}/g, '')
                .replace(/<meta[^>]*>/gi, '') 
                .replace(/<link[^>]*>/gi, ''); 
            
            bodyContent = `<div class="quoted-content" style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 10px;">${cleanedBody}</div>`;
        } else if (email.bodyText) {
            const escapedText = email.bodyText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            
            bodyContent = `<div class="quoted-content" style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 10px; white-space: pre-wrap; font-family: monospace;">${escapedText}</div>`;
        } else {
            // Fallback for empty content
            bodyContent = `<div class="quoted-content" style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 10px; color: #999;">[No content]</div>`;
        }
        
        return header + bodyContent;
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
