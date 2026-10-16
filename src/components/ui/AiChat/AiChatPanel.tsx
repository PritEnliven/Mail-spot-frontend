import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useAccount } from '@context/AccountContext';
import { useMailUI } from '@context/MailUIContext';
import { useMailData } from '@context/index';
import { useScreen } from '@context/ScreenContext';
import {
    useAiChat,
    type AiChatAssistantMessage,
    type AiChatMessage,
} from '@hooks/useAiChat';
import type { AiChatCitation, AiChatConversationSummary } from '@services/aiService/aiChatService';
import { AiChatMarkdown } from '@utils/aiChatMarkdown';
import {
    AI_SOURCES_BOX_TITLE,
    buildAiSourcesPagination,
    mapAiCitationsToEmails,
} from '@utils/aiChatCitationUtil';

/* ─── Status copy helpers ─────────────────────────────────── */
function getStatusCopy(msg: AiChatAssistantMessage): string | null {
    switch (msg.status) {
        case 'not_found':
            return "I couldn't find any emails that match your question.";
        case 'needs_clarification':
            return msg.clarifyingQuestion ?? 'Could you give me a bit more detail?';
        case 'refused':
            return "I can only help with read-only questions about your mailbox.";
        default:
            return null;
    }
}

interface MessageItemProps {
    msg: AiChatMessage;
    isLast: boolean;
    thumbs: 'up' | 'down' | null;
    onThumbsClick: (value: 'up' | 'down') => void;
    onShowSources: (citations: AiChatCitation[]) => void;
}

function MessageItem({
    msg,
    isLast: _isLast,
    thumbs: _thumbs,
    onThumbsClick: _onThumbsClick,
    onShowSources,
}: MessageItemProps) {
    if (msg.role === 'user') {
        return (
            <div className="ai-chat-message ai-chat-message--user">
                <span className="ai-chat-message__label">You</span>
                <div className="ai-chat-message__bubble">{msg.text}</div>
            </div>
        );
    }

    const statusCopy = getStatusCopy(msg);
    const sourceCount = msg.citations?.length ?? 0;

    return (
        <div className="ai-chat-message ai-chat-message--assistant">
            <span className="ai-chat-message__label">Mailspot assistant</span>

            {/* Answer text or status message */}
            {msg.answer ? (
                <div className="ai-chat-message__bubble ai-chat-message__bubble--md">
                    <AiChatMarkdown text={msg.answer} />
                </div>
            ) : statusCopy ? (
                <div className="ai-chat-status">{statusCopy}</div>
            ) : null}

            {sourceCount > 0 && (
                <button
                    type="button"
                    className="btn-new ai-chat-show-sources-btn"
                    onClick={() => onShowSources(msg.citations)}
                    title="List source emails in the mail panel"
                >
                    Show sources ({sourceCount})
                </button>
            )}
        </div>
    );
}

interface HistorySidebarProps {
    conversations: AiChatConversationSummary[];
    activeConversationId: string | null;
    isLoadingHistory: boolean;
    isLoadingMoreHistory: boolean;
    hasMore: boolean;
    onSelect: (conversationId: string) => void;
    onDelete: (conversationId: string) => void;
    onLoadMore: () => void;
    onClose?: () => void;
}

function HistorySidebar({
    conversations,
    activeConversationId,
    isLoadingHistory,
    isLoadingMoreHistory,
    hasMore,
    onSelect,
    onDelete,
    onLoadMore,
    onClose,
}: HistorySidebarProps) {
    return (
        <aside className="ai-chat-history" aria-label="Chat history">
            <div className="ai-chat-history__header">
                <h3 className="ai-chat-history__title">History</h3>
                {onClose && (
                    <button
                        type="button"
                        className="ai-chat-history__close-btn"
                        onClick={onClose}
                        aria-label="Hide chat history"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="ai-chat-history__list">
                {isLoadingHistory && conversations.length === 0 ? (
                    <div className="ai-chat-history__empty" role="status">
                        <span
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                        />
                        <span>Loading chats…</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="ai-chat-history__empty">No past chats</div>
                ) : (
                    conversations.map((item) => {
                        const isActive = item.conversationId === activeConversationId;
                        return (
                            <div
                                key={item.conversationId}
                                className={`ai-chat-history__item${isActive ? ' is-active' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="ai-chat-history__item-btn"
                                    onClick={() => onSelect(item.conversationId)}
                                    title={item.title || 'Untitled chat'}
                                >
                                    <span className="ai-chat-history__item-title">
                                        {item.title?.trim() || 'Untitled chat'}
                                    </span>
                                    {item.preview?.trim() ? (
                                        <span className="ai-chat-history__item-preview">
                                            {item.preview.trim()}
                                        </span>
                                    ) : null}
                                </button>
                                <button
                                    type="button"
                                    className="ai-chat-history__delete-btn"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        void onDelete(item.conversationId);
                                    }}
                                    aria-label={`Delete chat: ${item.title || 'Untitled chat'}`}
                                    title="Delete chat"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })
                )}

                {hasMore && (
                    <button
                        type="button"
                        className="btn-new ai-chat-history__load-more"
                        onClick={() => void onLoadMore()}
                        disabled={isLoadingMoreHistory}
                    >
                        {isLoadingMoreHistory ? 'Loading…' : 'Load more'}
                    </button>
                )}
            </div>
        </aside>
    );
}

/* ─── Main panel component ────────────────────────────────── */
export default function AiChatPanel() {
    const { isAiChatOpen, setIsAiChatOpen } = useMailUI();
    const { activeAccountId } = useAccount();
    const {
        userPermissions,
        setEmailDetailSelected,
        setActiveEmailMessageId,
        setEmails,
        setPagination,
        setTotalEmailBadge,
        setBoxTitle,
        setAllSearchResult,
        boxName,
        boxTitle,
    } = useMailData();

    const openFolderLabel = (boxTitle || boxName || 'this folder').trim();
    const { setIsMailListOpen, setToolbarState } = useMailUI();
    const { isMobilebig, isDesktop } = useScreen();

    const {
        messages,
        isLoading,
        thumbs,
        sendMessage,
        resetChat,
        sendThumbsFeedback,
        conversations,
        nextCursor,
        isLoadingHistory,
        isLoadingMoreHistory,
        isOpeningConversation,
        composerDisabled,
        activeConversationId,
        loadConversations,
        loadMoreConversations,
        openConversation,
        deleteConversation,
    } = useAiChat({ currentBoxName: boxName });

    const [inputText, setInputText] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /* Push AI source citations into the main mail list (like search results) — only on button click. */
    const showCitationsInMailList = useCallback(
        (citations: AiChatCitation[]) => {
            if (!citations.length) return;

            const listEmails = mapAiCitationsToEmails(citations);
            setAllSearchResult(true);
            setEmails(listEmails);
            setPagination(buildAiSourcesPagination(listEmails.length));
            setTotalEmailBadge(listEmails.length);
            setBoxTitle(AI_SOURCES_BOX_TITLE);
            setEmailDetailSelected(null);
            setActiveEmailMessageId(null);
            setToolbarState({
                showBack: false,
                showSelectAll: true,
                showRefresh: true,
                showDelete: false,
                showMarkAsRead: false,
                showMarkAsUnread: false,
                showMove: false,
            });

            if (!isDesktop) {
                setIsMailListOpen(true);
            }
        },
        [
            isDesktop,
            setActiveEmailMessageId,
            setAllSearchResult,
            setBoxTitle,
            setEmailDetailSelected,
            setEmails,
            setIsMailListOpen,
            setPagination,
            setToolbarState,
            setTotalEmailBadge,
        ],
    );

    /* Account switch: clear local composer UI and close the panel (hook clears transcript/history). */
    useEffect(() => {
        setInputText('');
        setIsHistoryOpen(false);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.classList.remove('is-scrollable');
        }
        setIsAiChatOpen(false);
    }, [activeAccountId, setIsAiChatOpen]);

    /* Load first history page whenever the panel opens; keep history closed until the user opens it. */
    useEffect(() => {
        if (!isAiChatOpen) return;
        setIsHistoryOpen(false);
        void loadConversations();
    }, [isAiChatOpen, loadConversations]);

    /* Auto-scroll to bottom on new messages */
    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [messages, isLoading, isOpeningConversation]);

    /* Focus textarea when panel opens */
    useEffect(() => {
        if (isAiChatOpen && !composerDisabled) {
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isAiChatOpen, composerDisabled]);

    /* Grow textarea with content */
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        const el = e.target;
        el.style.height = 'auto';
        const needsScroll = el.scrollHeight > 120;
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
        // Only allow a scrollbar once the field hits max height (avoids the black line)
        el.classList.toggle('is-scrollable', needsScroll);
    };

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || composerDisabled) return;
        setInputText('');
        
        if (textareaRef.current) {                                  
            textareaRef.current.style.height = 'auto';         
            textareaRef.current.classList.remove('is-scrollable');
        }

        await sendMessage(text);
        if (isMobilebig) {
            setIsHistoryOpen(false);
        }
    }, [composerDisabled, inputText, isMobilebig, sendMessage]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    const handleNewChat = () => {
        resetChat();
        setInputText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
        }
        if (isMobilebig) {
            setIsHistoryOpen(false);
        }
    };

    const handleClose = () => {
        setIsAiChatOpen(false);
    };

    const handleSelectConversation = async (conversationId: string) => {
        await openConversation(conversationId);
        setInputText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        if (isMobilebig) {
            setIsHistoryOpen(false);
        }
    };

    /* Don't render the panel at all if feature is disabled */
    if (!userPermissions?.aiFeatures) return null;

    /* Determine which assistant messages are "last" for thumbs display */
    const lastAssistantIndex = messages.reduceRight(
        (acc, m, i) => (acc === -1 && m.role === 'assistant' ? i : acc),
        -1,
    );

    const showHistorySidebar = isHistoryOpen;

    return (
        <>
            {/* Mobile backdrop (full-screen panel ≤767px) */}
            {isMobilebig && isAiChatOpen && (
                <div className="ai-chat-backdrop" onClick={handleClose} aria-hidden="true" />
            )}

            <aside
                className={`ai-chat-panel${isAiChatOpen ? ' is-open' : ''}${showHistorySidebar ? ' has-history' : ''}`}
                role="complementary"
                aria-label="Find in mail — AI chat"
                aria-hidden={!isAiChatOpen}
            >
                {/* ── Header ── */}
                <div className="ai-chat-panel__header">
                    <div className="ai-chat-panel__title-wrap">
                        <button
                            type="button"
                            className={`ai-chat-panel__history-toggle${isHistoryOpen ? ' is-active' : ''}`}
                            onClick={() => setIsHistoryOpen((open) => !open)}
                            aria-pressed={isHistoryOpen}
                            aria-label={isHistoryOpen ? 'Hide chat history' : 'Show chat history'}
                            title="Chat history"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="9" />
                                <polyline points="12 7 12 12 15 14" />
                            </svg>
                        </button>
                        <h2 className="ai-chat-panel__title">Find in mail</h2>
                        <span className="ai-chat-panel__shortcut" title="Keyboard shortcut">
                            Ctrl+D
                        </span>
                    </div>
                    <div className="ai-chat-panel__header-actions">
                        <button
                            type="button"
                            className="btn-new ai-chat-panel__new-btn"
                            onClick={handleNewChat}
                            title="Start a new conversation"
                        >
                            New chat
                        </button>
                        <button
                            type="button"
                            className="ai-chat-panel__close-btn"
                            onClick={handleClose}
                            aria-label="Close AI chat panel"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="ai-chat-panel__content">
                    {showHistorySidebar && (
                        <HistorySidebar
                            conversations={conversations}
                            activeConversationId={activeConversationId}
                            isLoadingHistory={isLoadingHistory}
                            isLoadingMoreHistory={isLoadingMoreHistory}
                            hasMore={Boolean(nextCursor)}
                            onSelect={(id) => void handleSelectConversation(id)}
                            onDelete={(id) => void deleteConversation(id)}
                            onLoadMore={loadMoreConversations}
                            onClose={isMobilebig ? () => setIsHistoryOpen(false) : undefined}
                        />
                    )}

                    <div className="ai-chat-panel__chat">
                        {/* ── Body ── */}
                        <div className="ai-chat-panel__body" ref={bodyRef}>
                            {isOpeningConversation ? (
                                <div className="ai-chat-loading" aria-live="polite" aria-busy="true">
                                    <span
                                        className="spinner-border spinner-border-sm text-primary"
                                        role="status"
                                    />
                                    <span>Opening chat…</span>
                                </div>
                            ) : messages.length === 0 && !isLoading ? (
                                <div className="ai-chat-empty">
                                    <svg className="ai-chat-empty__icon" viewBox="0 0 24 24" fill="none" stroke="#717d84" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        <path d="M11 8v3l2 2" />
                                    </svg>
                                    <p className="ai-chat-empty__title">Ask about your mail</p>
                                    <p className="ai-chat-empty__hint">
                                        Answers are limited to emails in your currently open folder
                                        {' '}(<strong>{openFolderLabel}</strong>).
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, i) => (
                                        <MessageItem
                                            key={i}
                                            msg={msg}
                                            isLast={i === lastAssistantIndex}
                                            thumbs={i === lastAssistantIndex ? thumbs : null}
                                            onThumbsClick={sendThumbsFeedback}
                                            onShowSources={showCitationsInMailList}
                                        />
                                    ))}

                                    {isLoading && (
                                        <div className="ai-chat-loading" aria-live="polite" aria-busy="true">
                                            <span
                                                className="spinner-border spinner-border-sm text-primary"
                                                role="status"
                                            />
                                            <span>Searching your mailbox…</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        <div className="ai-chat-panel__footer">
                            <p className="ai-chat-disclaimer">
                                Answers come from retrieved mailbox emails. Open the source to verify.
                            </p>
                            <div className="ai-chat-input-row">
                                <div className="ai-chat-input-wrap">
                                    <textarea
                                        ref={textareaRef}
                                        className="form-control ai-chat-panel__textarea"
                                        placeholder="Ask about your emails…"
                                        value={inputText}
                                        rows={1}
                                        onChange={handleTextareaChange}
                                        onKeyDown={handleKeyDown}
                                        disabled={composerDisabled}
                                        aria-label="Message input"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn-new btn-new-bg ai-chat-panel__send-btn"
                                    onClick={() => void handleSend()}
                                    disabled={composerDisabled || !inputText.trim()}
                                    aria-label="Send message"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
