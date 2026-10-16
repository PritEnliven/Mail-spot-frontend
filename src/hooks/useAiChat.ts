import { useCallback, useEffect, useRef, useState } from 'react';
import { showError } from '@components/ui/toast/toastNotification';
import { useAccount } from '@context/AccountContext';
import { useMailData } from '@context/MailDataContext';
import {
    deleteAiChatConversation,
    getAiChatConversation,
    listAiChatConversations,
    postAiChat,
    postAiChatFeedback,
    type AiChatCitation,
    type AiChatConversationSummary,
    type AiChatConversationTurn,
    type AiChatFilters,
    type AiChatStatus,
} from '@services/aiService/aiChatService';

export interface AiChatUserMessage {
    role: 'user';
    text: string;
}

export interface AiChatAssistantMessage {
    role: 'assistant';
    answer: string;
    citations: AiChatCitation[];
    status: AiChatStatus | null;
    clarifyingQuestion?: string;
    conversationId: string;
}

export type AiChatMessage = AiChatUserMessage | AiChatAssistantMessage;

export type ThumbsValue = 'up' | 'down' | null;

const HISTORY_PAGE_SIZE = 20;
const AI_DISABLED_MESSAGE = 'Please contact admin to enable AI features';

function aiDisabledMessage(response: any): string {
    return (
        response?.data?.error ||
        response?.error ||
        response?.message ||
        AI_DISABLED_MESSAGE
    );
}

function normalizeCitation(raw: Partial<AiChatCitation> | null | undefined, index: number): AiChatCitation {
    return {
        index: raw?.index ?? index + 1,
        mongoId: raw?.mongoId ?? '',
        messageId: raw?.messageId ?? '',
        threadId: raw?.threadId,
        subject: raw?.subject ?? '',
        from: raw?.from ?? '',
        to: raw?.to ?? '',
        date: raw?.date ?? '',
        boxName: raw?.boxName ?? '',
        snippet: raw?.snippet ?? '',
    };
}

function normalizeCitations(raw: unknown): AiChatCitation[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item, index) => normalizeCitation(item as Partial<AiChatCitation>, index))
        .filter((c) => Boolean(c.mongoId));
}

function turnsToMessages(
    turns: AiChatConversationTurn[],
    conversationId: string,
): AiChatMessage[] {
    const messages: AiChatMessage[] = [];

    for (const turn of turns ?? []) {
        if (turn.role === 'user') {
            messages.push({ role: 'user', text: turn.content ?? '' });
            continue;
        }
        if (turn.role === 'assistant') {
            messages.push({
                role: 'assistant',
                answer: turn.content ?? '',
                citations: normalizeCitations(turn.citations),
                status: turn.status ?? null,
                conversationId,
            });
        }
    }

    return messages;
}

function titleFromFirstUserMessage(text: string): string {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (trimmed.length <= 80) return trimmed;
    return `${trimmed.slice(0, 77)}…`;
}

function previewFromAnswer(answer: string): string {
    const trimmed = answer.trim().replace(/\s+/g, ' ');
    if (!trimmed) return '';
    if (trimmed.length <= 120) return trimmed;
    return `${trimmed.slice(0, 117)}…`;
}

const NON_MAIL_FOLDERS = new Set(['settings', 'calendar', 'contact']);

function resolveMailboxFolder(boxName?: string | null): string {
    const folder = String(boxName ?? '').trim();
    if (!folder) return '';
    if (NON_MAIL_FOLDERS.has(folder.toLowerCase())) return '';
    return folder;
}

interface UseAiChatOptions {
    /** Current mailbox folder name to scope queries (falls back to MailDataContext.boxName). */
    currentBoxName?: string;
}

export function useAiChat({ currentBoxName }: UseAiChatOptions = {}) {
    const { activeAccountId } = useAccount();
    const { boxName: contextBoxName } = useMailData();

    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [thumbs, setThumbs] = useState<ThumbsValue>(null);
    const conversationIdRef = useRef<string | null>(null);
    /** Always the latest open mailbox folder — used at send time so filters.boxName cannot go stale. */
    const openFolderRef = useRef('');
    /** Bumps on account switch so in-flight history/open/send responses are ignored. */
    const accountEpochRef = useRef(0);

    openFolderRef.current = resolveMailboxFolder(currentBoxName ?? contextBoxName);

    const [conversations, setConversations] = useState<AiChatConversationSummary[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
    const [isOpeningConversation, setIsOpeningConversation] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    /** The conversationId of the most recent assistant reply (for feedback) */
    const latestConversationId = conversationIdRef.current;

    /** The status of the most recent assistant reply */
    const lastAssistantMsg = [...messages].reverse().find(
        (m): m is AiChatAssistantMessage => m.role === 'assistant',
    );

    const clearAllChatState = useCallback(() => {
        accountEpochRef.current += 1;
        setMessages([]);
        setIsLoading(false);
        setThumbs(null);
        conversationIdRef.current = null;
        setActiveConversationId(null);
        setIsOpeningConversation(false);
        setConversations([]);
        setNextCursor(null);
        setIsLoadingHistory(false);
        setIsLoadingMoreHistory(false);
    }, []);

    // Drop previous mailbox transcript/history when the active account changes.
    useEffect(() => {
        clearAllChatState();
    }, [activeAccountId, clearAllChatState]);

    const loadConversations = useCallback(async () => {
        const epoch = accountEpochRef.current;
        setIsLoadingHistory(true);
        try {
            const response = await listAiChatConversations({ limit: HISTORY_PAGE_SIZE });
            if (epoch !== accountEpochRef.current) return;

            if (response?.statusCode === 403) {
                showError(aiDisabledMessage(response));
                setConversations([]);
                setNextCursor(null);
                return;
            }

            if (response?.statusCode !== 200 || !response?.data) {
                showError(response?.message || 'Failed to load chat history.');
                return;
            }

            setConversations(response.data.conversations ?? []);
            setNextCursor(response.data.nextCursor ?? null);
        } catch {
            if (epoch === accountEpochRef.current) {
                showError('Failed to load chat history.');
            }
        } finally {
            if (epoch === accountEpochRef.current) {
                setIsLoadingHistory(false);
            }
        }
    }, []);

    const loadMoreConversations = useCallback(async () => {
        if (!nextCursor || isLoadingMoreHistory || isLoadingHistory) return;

        const epoch = accountEpochRef.current;
        setIsLoadingMoreHistory(true);
        try {
            const response = await listAiChatConversations({
                limit: HISTORY_PAGE_SIZE,
                before: nextCursor,
            });
            if (epoch !== accountEpochRef.current) return;

            if (response?.statusCode === 403) {
                showError(aiDisabledMessage(response));
                return;
            }

            if (response?.statusCode !== 200 || !response?.data) {
                showError(response?.message || 'Failed to load more chats.');
                return;
            }

            const page = (response.data.conversations ?? []) as AiChatConversationSummary[];
            setConversations((prev) => {
                const seen = new Set(prev.map((c) => c.conversationId));
                const appended = page.filter((c) => !seen.has(c.conversationId));
                return [...prev, ...appended];
            });
            setNextCursor(response.data.nextCursor ?? null);
        } catch {
            if (epoch === accountEpochRef.current) {
                showError('Failed to load more chats.');
            }
        } finally {
            if (epoch === accountEpochRef.current) {
                setIsLoadingMoreHistory(false);
            }
        }
    }, [isLoadingHistory, isLoadingMoreHistory, nextCursor]);

    const resetChat = useCallback(() => {
        setMessages([]);
        setIsLoading(false);
        setThumbs(null);
        conversationIdRef.current = null;
        setActiveConversationId(null);
        setIsOpeningConversation(false);
    }, []);

    const openConversation = useCallback(
        async (conversationId: string) => {
            if (!conversationId || isOpeningConversation || isLoading) return;

            const epoch = accountEpochRef.current;
            setIsOpeningConversation(true);
            setThumbs(null);

            try {
                const response = await getAiChatConversation(conversationId);
                if (epoch !== accountEpochRef.current) return;

                if (response?.statusCode === 403) {
                    showError(aiDisabledMessage(response));
                    return;
                }

                if (response?.statusCode === 404) {
                    setConversations((prev) =>
                        prev.filter((c) => c.conversationId !== conversationId),
                    );
                    resetChat();
                    return;
                }

                if (response?.statusCode !== 200 || !response?.data) {
                    showError(response?.message || 'Failed to open chat.');
                    return;
                }

                const turns = (response.data.turns ?? []) as AiChatConversationTurn[];
                conversationIdRef.current = conversationId;
                setActiveConversationId(conversationId);
                setMessages(turnsToMessages(turns, conversationId));
            } catch {
                if (epoch === accountEpochRef.current) {
                    showError('Failed to open chat.');
                }
            } finally {
                if (epoch === accountEpochRef.current) {
                    setIsOpeningConversation(false);
                }
            }
        },
        [isLoading, isOpeningConversation, resetChat],
    );

    const deleteConversation = useCallback(
        async (conversationId: string) => {
            if (!conversationId) return;

            try {
                const response = await deleteAiChatConversation(conversationId);

                if (response?.statusCode === 403) {
                    showError(aiDisabledMessage(response));
                    return;
                }

                if (response?.statusCode !== 200) {
                    showError(response?.message || 'Failed to delete chat.');
                    return;
                }

                setConversations((prev) =>
                    prev.filter((c) => c.conversationId !== conversationId),
                );

                if (
                    conversationIdRef.current === conversationId ||
                    activeConversationId === conversationId
                ) {
                    resetChat();
                }
            } catch {
                showError('Failed to delete chat.');
            }
        },
        [activeConversationId, resetChat],
    );

    const sendMessage = useCallback(
        async (text: string, filters?: AiChatFilters) => {
            const trimmed = text.trim();
            if (!trimmed || isLoading || isOpeningConversation) return;

            // Scope retrieval to the currently open folder. Without filters.boxName the
            // backend falls back to the whole mailbox.
            const openFolder = openFolderRef.current || resolveMailboxFolder(currentBoxName);
            const appliedFilters: AiChatFilters = {
                ...filters,
                ...(openFolder ? { boxName: openFolder } : {}),
            };

            const wasNewChat = !conversationIdRef.current;
            const epoch = accountEpochRef.current;

            setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
            setIsLoading(true);
            setThumbs(null);

            try {
                const response = await postAiChat({
                    message: trimmed,
                    conversationId: conversationIdRef.current,
                    ...(openFolder ? { boxName: openFolder } : {}),
                    filters: appliedFilters,
                });
                if (epoch !== accountEpochRef.current) return;

                if (response?.statusCode === 403) {
                    showError(aiDisabledMessage(response));
                    setMessages((prev) => prev.slice(0, -1));
                    return;
                }

                if (response?.statusCode === 503) {
                    showError('AI is temporarily unavailable. Please try again shortly.');
                    setMessages((prev) => prev.slice(0, -1));
                    return;
                }

                if (response?.statusCode !== 200 || !response?.data) {
                    showError(response?.message || 'Something went wrong. Please try again.');
                    setMessages((prev) => prev.slice(0, -1));
                    return;
                }

                const data = response.data;
                const nextConversationId = data.conversationId as string;
                conversationIdRef.current = nextConversationId;
                setActiveConversationId(nextConversationId);

                const citations = normalizeCitations(data.citations);
                const answer = data.answer ?? '';
                const status = (data.status ?? null) as AiChatStatus | null;

                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        answer,
                        citations,
                        status,
                        clarifyingQuestion: data.clarifyingQuestion,
                        conversationId: nextConversationId,
                    },
                ]);

                const now = new Date().toISOString();
                setConversations((prev) => {
                    const existing = prev.find((c) => c.conversationId === nextConversationId);
                    const entry: AiChatConversationSummary = {
                        conversationId: nextConversationId,
                        title: wasNewChat
                            ? titleFromFirstUserMessage(trimmed)
                            : (existing?.title || titleFromFirstUserMessage(trimmed)),
                        preview: previewFromAnswer(answer) || previewFromAnswer(trimmed),
                        turnCount: (existing?.turnCount ?? 0) + 2,
                        createdAt: existing?.createdAt ?? now,
                        updatedAt: now,
                    };
                    const without = prev.filter((c) => c.conversationId !== nextConversationId);
                    return [entry, ...without];
                });
            } catch {
                if (epoch === accountEpochRef.current) {
                    showError('Failed to reach the AI. Please try again.');
                    setMessages((prev) => prev.slice(0, -1));
                }
            } finally {
                if (epoch === accountEpochRef.current) {
                    setIsLoading(false);
                }
            }
        },
        [currentBoxName, isLoading, isOpeningConversation],
    );

    const sendCitationClickFeedback = useCallback(
        async (citation: AiChatCitation, chatStatus: AiChatStatus | null) => {
            if (!conversationIdRef.current || !citation.mongoId) return;
            await postAiChatFeedback({
                event: 'ai_chat.citation_click',
                conversationId: conversationIdRef.current,
                mongoId: citation.mongoId,
                chatStatus,
            });
        },
        [],
    );

    const sendThumbsFeedback = useCallback(
        async (value: 'up' | 'down') => {
            if (!conversationIdRef.current || !lastAssistantMsg) return;
            setThumbs(value);
            await postAiChatFeedback({
                event: 'ai_chat.thumbs',
                conversationId: conversationIdRef.current,
                thumbs: value,
                chatStatus: lastAssistantMsg.status,
            });
        },
        [lastAssistantMsg],
    );

    return {
        messages,
        isLoading,
        thumbs,
        latestConversationId,
        lastAssistantStatus: lastAssistantMsg?.status ?? null,
        hasConversation: messages.length > 0,
        activeConversationId,
        conversations,
        nextCursor,
        isLoadingHistory,
        isLoadingMoreHistory,
        isOpeningConversation,
        composerDisabled: isLoading || isOpeningConversation,
        sendMessage,
        resetChat,
        loadConversations,
        loadMoreConversations,
        openConversation,
        deleteConversation,
        sendCitationClickFeedback,
        sendThumbsFeedback,
    };
}
