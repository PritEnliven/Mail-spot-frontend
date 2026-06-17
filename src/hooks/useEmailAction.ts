import { useState } from 'react';
import { useMailData } from '../context/index';
import { deleteEmails, readUnreadEmails } from '../services/emailAction/emailActionService';

export function useEmailAction() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { boxName, updateEmailReadState, updateBoxCount, emails, setEmailDetailSelected, activeEmailMessageId, setActiveEmailMessageId, deleteEmailState, fetchEmails, mailListPage } = useMailData();

    const markAsRead = async (messageIds: string[]) => {
        setLoading(true);
        setError(null);
        try {
            const response = await readUnreadEmails({
                messageIds,
                current_active_box: boxName,
                markAsRead: true
            });
            if (response.statusCode === 200) {
                updateEmailReadState(messageIds, true);
                // Update box counts - decrement unread count for emails being marked as read
                const unreadEmailsCount = emails.filter(email => messageIds.includes(email.messageId) && !email.isSeen).length;
                updateBoxCount(boxName, -unreadEmailsCount, 0);
            }
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark as read');
            throw err;
        } finally {
            setLoading(false);
        }
    }

    const markAsUnread = async (messageIds: string[]) => {
        setLoading(true);
        setError(null);
        try {
            const response = await readUnreadEmails({
                messageIds,
                current_active_box: boxName,
                markAsRead: false
            });
            if (response.statusCode === 200) {
                updateEmailReadState(messageIds, false);
                // Update box counts - increment unread count for emails being marked as unread
                const readEmailCount = emails.filter(email => messageIds.includes(email.messageId) && email.isSeen).length;
                updateBoxCount(boxName, readEmailCount, 0); // Negative to increment
            }
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark as unread');
            throw err;
        } finally {
            setLoading(false);
        }
    }

    const deleteEmail = async (messageIds: string[], isDraftMail = false) => {
        setLoading(true);
        setError(null);
        try {
            const response = await deleteEmails({
                messageIds,
                current_active_box: boxName,
                isDraftMail
            });
            if (response.statusCode === 200) {
                const remainingEmails = emails.filter(email => !messageIds.includes(email.messageId));
                deleteEmailState(messageIds);
                if (activeEmailMessageId && messageIds.includes(activeEmailMessageId)) {
                    setActiveEmailMessageId(null);
                    setEmailDetailSelected(null);
                }
                if (remainingEmails.length === 0) {
                    const targetPage = mailListPage > 1 ? mailListPage - 1 : 1;
                    await fetchEmails(targetPage, boxName);
                }
            }
            return response;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete emails');
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return {
        markAsRead,
        markAsUnread,
        deleteEmail,
        loading,
        error
    }
}