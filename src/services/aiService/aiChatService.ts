import { deleteData, getData, postData } from '../apiService';

export interface AiChatCitation {
    index?: number;
    mongoId: string;
    messageId?: string;
    threadId?: string;
    subject?: string;
    from?: string;
    to?: string;
    date?: string;
    boxName?: string;
    snippet?: string;
}

export type AiChatStatus = 'answered' | 'not_found' | 'needs_clarification' | 'refused';

export interface AiChatResponse {
    conversationId: string;
    answer: string;
    citations: AiChatCitation[];
    status: AiChatStatus;
    clarifyingQuestion?: string;
    retrievalHitCount?: number;
    latencyMs?: number;
}

export interface AiChatFilters {
    boxName?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface PostAiChatPayload {
    message: string;
    conversationId?: string | null;
    /** Open mailbox folder; also sent as filters.boxName. */
    boxName?: string;
    filters?: AiChatFilters;
}

export type AiChatFeedbackEvent = 'ai_chat.citation_click' | 'ai_chat.thumbs';

export interface PostAiChatFeedbackPayload {
    event: AiChatFeedbackEvent;
    conversationId: string;
    mongoId?: string;
    chatStatus?: AiChatStatus | null;
    thumbs?: 'up' | 'down';
}

export interface AiChatConversationSummary {
    conversationId: string;             
    title: string;
    preview: string;
    turnCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface AiChatConversationTurn {
    role: 'user' | 'assistant';
    content: string;
    status: AiChatStatus | null;
    citations: AiChatCitation[];
    createdAt: string;
}

export interface ListAiChatConversationsParams {
    limit?: number;
    before?: string | null;
}

async function postAiChat(payload: PostAiChatPayload) {
    try {
        const response = await postData('email/ai-chat', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function postAiChatFeedback(payload: PostAiChatFeedbackPayload) {
    try {
        const response = await postData('email/ai-chat/feedback', payload);
        return response;
    } catch {
        // Feedback is best-effort; don't surface errors to the user
    }
}

async function listAiChatConversations(params: ListAiChatConversationsParams = {}) {
    try {
        const response = await getData('email/ai-chat/conversations', {
            params: {
                limit: params.limit ?? 20,
                ...(params.before ? { before: params.before } : {}),
            }
        });
        return response;                          
    } catch (error: any) {
        return error;
    }
}

async function getAiChatConversation(conversationId: string) {
    try {
        const response = await getData(
            `email/ai-chat/conversations/${encodeURIComponent(conversationId)}`,
        );
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteAiChatConversation(conversationId: string) {
    try {
        const response = await deleteData(
            `email/ai-chat/conversations/${encodeURIComponent(conversationId)}`,
            {},
        );                                    
        return response;
    } 
    catch (error: any) {
        return error;
    }
}

export {
    postAiChat,
    postAiChatFeedback,
    listAiChatConversations,
    getAiChatConversation,
    deleteAiChatConversation,
};
