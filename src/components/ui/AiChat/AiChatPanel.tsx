// // import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
// // import { createPortal } from 'react-dom';
// // import { useAccount } from '@context/AccountContext';
// // import { useMailUI } from '@context/MailUIContext';
// // import { useMailData } from '@context/index';
// // import { useScreen } from '@context/ScreenContext';
// // import deleteIconHover from "@images/trash-icon-hover.svg";
// // import deleteIcon from "@images/trash-icon.svg";
// // import historyIcon from "@images/history-icon.svg";
// // import historyIconHover from "@images/history-icon-hover.svg"
// // import folderIcon from "@images/plus-icon.svg";
// // import folderIconHover from "@images/plus-icon-hover.svg";
// // import InteractiveIcon from '../InteractiveIcon';
// // import {
// //     useAiChat,
// //     type AiChatAssistantMessage,
// //     type AiChatMessage,
// // } from '@hooks/useAiChat';
// // import type { AiChatCitation, AiChatConversationSummary } from '@services/aiService/aiChatService';
// // import { AiChatMarkdown } from '@utils/aiChatMarkdown';
// // import {
// //     AI_SOURCES_BOX_TITLE,
// //     buildAiSourcesPagination,
// //     mapAiCitationsToEmails,
// // } from '@utils/aiChatCitationUtil';

// // /* ─── Status copy helpers ─────────────────────────────────── */
// // function getStatusCopy(msg: AiChatAssistantMessage): string | null {
// //     switch (msg.status) {
// //         case 'not_found':
// //             return "I couldn't find any emails that match your question.";
// //         case 'needs_clarification':
// //             return msg.clarifyingQuestion ?? 'Could you give me a bit more detail?';
// //         case 'refused':
// //             return "I can only help with read-only questions about your mailbox.";
// //         default:
// //             return null;
// //     }
// // }

// // interface MessageItemProps {
// //     msg: AiChatMessage;
// //     isLast: boolean;
// //     thumbs: 'up' | 'down' | null;
// //     onThumbsClick: (value: 'up' | 'down') => void;
// //     onShowSources: (citations: AiChatCitation[]) => void;
// // }

// // function MessageItem({
// //     msg,
// //     isLast: _isLast,
// //     thumbs: _thumbs,
// //     onThumbsClick: _onThumbsClick,
// //     onShowSources,
// // }: MessageItemProps) {
// //     if (msg.role === 'user') {
// //         return (
// //             <div className="ai-chat-message ai-chat-message--user">
// //                 <span className="ai-chat-message__label">You</span>
// //                 <div className="ai-chat-message__bubble">{msg.text}</div>
// //             </div>
// //         );
// //     }

// //     const statusCopy = getStatusCopy(msg);
// //     const sourceCount = msg.citations?.length ?? 0;

// //     return (
// //         <div className="ai-chat-message ai-chat-message--assistant">
// //             <span className="ai-chat-message__label">Mailspot assistant</span>

// //             {/* Answer text or status message */}
// //             {msg.answer ? (
// //                 <div className="ai-chat-message__bubble ai-chat-message__bubble--md">
// //                     <AiChatMarkdown text={msg.answer} />
// //                 </div>
// //             ) : statusCopy ? (
// //                 <div className="ai-chat-status">{statusCopy}</div>
// //             ) : null}

// //             {sourceCount > 0 && (
// //                 <button
// //                     type="button"
// //                     className="btn-new ai-chat-show-sources-btn"
// //                     onClick={() => onShowSources(msg.citations)}
// //                     title="List source emails in the mail panel"
// //                 >
// //                     Show sources ({sourceCount})
// //                 </button>
// //             )}
// //         </div>
// //     );
// // }

// // interface HistoryDropdownProps {
// //     conversations: AiChatConversationSummary[];
// //     activeConversationId: string | null;
// //     isLoadingHistory: boolean;
// //     isLoadingMoreHistory: boolean;
// //     hasMore: boolean;
// //     position: { top: number; left: number };
// //     onSelect: (conversationId: string) => void;
// //     onDelete: (conversationId: string) => void;
// //     onLoadMore: () => void;
// // }

// // function HistoryDropdown({
// //     conversations,
// //     activeConversationId,
// //     isLoadingHistory,
// //     isLoadingMoreHistory,
// //     hasMore,
// //     position,
// //     onSelect,
// //     onDelete,
// //     onLoadMore,
// // }: HistoryDropdownProps) {
// //     return (
// //         <div
// //             className="ai-chat-history-dropdown"
// //             role="menu"
// //             aria-label="Previous chats"
// //             style={{ top: position.top, left: position.left }}
// //         >
// //             <div className="ai-chat-history-dropdown__header">Previous</div>

// //             <div className="ai-chat-history-dropdown__list">
// //                 {isLoadingHistory && conversations.length === 0 ? (
// //                     <div className="ai-chat-history-dropdown__empty" role="status">
// //                         <span
// //                             className="spinner-border spinner-border-sm text-primary"
// //                             role="status"
// //                         />
// //                         <span>Loading…</span>
// //                     </div>
// //                 ) : conversations.length === 0 ? (
// //                     <div className="ai-chat-history-dropdown__empty">No past chats</div>
// //                 ) : (
// //                     conversations.map((item) => {
// //                         const isActive = item.conversationId === activeConversationId;
// //                         const title = item.title?.trim() || 'Untitled chat';
// //                         return (
// //                             <div
// //                                 key={item.conversationId}
// //                                 className={`ai-chat-history-dropdown__item${isActive ? ' is-active' : ''}`}
// //                                 role="none"
// //                             >
// //                                 <button
// //                                     type="button"
// //                                     className="ai-chat-history-dropdown__item-btn"
// //                                     role="menuitem"
// //                                     onClick={() => onSelect(item.conversationId)}
// //                                     title={title}
// //                                 >
// //                                     <span className="ai-chat-history-dropdown__item-title">
// //                                         {title}
// //                                     </span>
// //                                 </button>
// //                                 <button
// //                                     type="button"
// //                                     className="ai-chat-history-dropdown__delete-btn hover-link icon-hover-effect"
// //                                     onClick={(event) => {
// //                                         event.preventDefault();
// //                                         event.stopPropagation();
// //                                         void onDelete(item.conversationId);
// //                                     }}
// //                                     aria-label={`Delete chat: ${title}`}
// //                                 >
// //                                     <InteractiveIcon
// //                                         defaultIcon={deleteIcon}
// //                                         hoverIcon={deleteIconHover}
// //                                         activeIcon=""
// //                                         isActive={false}
// //                                         alt=""
// //                                         className="interactive-icon hover-image"
// //                                         renderAs="img"
// //                                         tooltip="Delete chat"
// //                                     />
// //                                 </button>
// //                             </div>
// //                         );
// //                     })
// //                 )}

// //                 {hasMore && (
// //                     <button
// //                         type="button"
// //                         className="btn-new ai-chat-history-dropdown__load-more"
// //                         onClick={() => void onLoadMore()}
// //                         disabled={isLoadingMoreHistory}
// //                     >
// //                         {isLoadingMoreHistory ? 'Loading…' : 'Load more'}
// //                     </button>
// //                 )}
// //             </div>
// //         </div>
// //     );
// // }

// // /* ─── Main panel component ────────────────────────────────── */
// // export default function AiChatPanel() {
// //     const { isAiChatOpen, setIsAiChatOpen } = useMailUI();
// //     const { activeAccountId } = useAccount();
// //     const {
// //         userPermissions,
// //         setEmailDetailSelected,
// //         setActiveEmailMessageId,
// //         setEmails,
// //         setPagination,
// //         setTotalEmailBadge,
// //         setBoxTitle,
// //         setAllSearchResult,
// //         boxName,
// //         boxTitle,
// //     } = useMailData();

// //     const openFolderLabel = (boxTitle || boxName || 'this folder').trim();
// //     const { setIsMailListOpen, setToolbarState } = useMailUI();
// //     const { isMobilebig, isDesktop } = useScreen();

// //     const {
// //         messages,
// //         isLoading,
// //         thumbs,
// //         sendMessage,
// //         resetChat,
// //         sendThumbsFeedback,
// //         conversations,
// //         nextCursor,
// //         isLoadingHistory,
// //         isLoadingMoreHistory,
// //         isOpeningConversation,
// //         composerDisabled,
// //         activeConversationId,
// //         loadConversations,
// //         loadMoreConversations,
// //         openConversation,
// //         deleteConversation,
// //     } = useAiChat({ currentBoxName: boxName });

// //     const [inputText, setInputText] = useState('');
// //     const [isHistoryOpen, setIsHistoryOpen] = useState(false);
// //     const [historyDropdownPos, setHistoryDropdownPos] = useState<{ top: number; left: number } | null>(null);
// //     const bodyRef = useRef<HTMLDivElement>(null);
// //     const textareaRef = useRef<HTMLTextAreaElement>(null);
// //     const historyToggleRef = useRef<HTMLDivElement>(null);

// //     /* Push AI source citations into the main mail list (like search results) — only on button click. */
// //     const showCitationsInMailList = useCallback(
// //         (citations: AiChatCitation[]) => {
// //             if (!citations.length) return;

// //             const listEmails = mapAiCitationsToEmails(citations);
// //             setAllSearchResult(true);
// //             setEmails(listEmails);
// //             setPagination(buildAiSourcesPagination(listEmails.length));
// //             setTotalEmailBadge(listEmails.length);
// //             setBoxTitle(AI_SOURCES_BOX_TITLE);
// //             setEmailDetailSelected(null);
// //             setActiveEmailMessageId(null);
// //             setToolbarState({
// //                 showBack: false,
// //                 showSelectAll: true,
// //                 showRefresh: true,
// //                 showDelete: false,
// //                 showMarkAsRead: false,
// //                 showMarkAsUnread: false,
// //                 showMove: false,
// //             });

// //             if (!isDesktop) {
// //                 setIsMailListOpen(true);
// //             }
// //         },
// //         [
// //             isDesktop,
// //             setActiveEmailMessageId,
// //             setAllSearchResult,
// //             setBoxTitle,
// //             setEmailDetailSelected,
// //             setEmails,
// //             setIsMailListOpen,
// //             setPagination,
// //             setToolbarState,
// //             setTotalEmailBadge,
// //         ],
// //     );

// //     /* Account switch: clear local composer UI and close the panel (hook clears transcript/history). */
// //     useEffect(() => {
// //         setInputText('');
// //         setIsHistoryOpen(false);
// //         if (textareaRef.current) {
// //             textareaRef.current.style.height = 'auto';
// //             textareaRef.current.classList.remove('is-scrollable');
// //         }
// //         setIsAiChatOpen(false);
// //     }, [activeAccountId, setIsAiChatOpen]);

// //     /* Load first history page whenever the panel opens; keep history closed until the user opens it. */
// //     useEffect(() => {
// //         if (!isAiChatOpen) {
// //             setIsHistoryOpen(false);
// //             return;
// //         }
// //         setIsHistoryOpen(false);
// //         void loadConversations();
// //     }, [isAiChatOpen, loadConversations]);

// //     /* Auto-scroll to bottom on new messages */
// //     useEffect(() => {
// //         if (bodyRef.current) {
// //             bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
// //         }
// //     }, [messages, isLoading, isOpeningConversation]);

// //     /* Focus textarea when panel opens */
// //     useEffect(() => {
// //         if (isAiChatOpen && !composerDisabled) {
// //             setTimeout(() => textareaRef.current?.focus(), 100);
// //         }
// //     }, [isAiChatOpen, composerDisabled]);

// //     /* Position history dropdown under the toggle (portaled; panel overflow clips otherwise). */
// //     useLayoutEffect(() => {
// //         if (!isHistoryOpen) {
// //             setHistoryDropdownPos(null);
// //             return;
// //         }

// //         const updatePosition = () => {
// //             const anchor = historyToggleRef.current;
// //             if (!anchor) return;
// //             const rect = anchor.getBoundingClientRect();
// //             const dropdownWidth = Math.min(280, window.innerWidth - 24);
// //             let left = rect.left;
// //             left = Math.min(left, window.innerWidth - dropdownWidth - 8);
// //             left = Math.max(8, left);
// //             setHistoryDropdownPos({
// //                 top: rect.bottom + 8,
// //                 left,
// //             });
// //         };

// //         updatePosition();
// //         window.addEventListener('resize', updatePosition);
// //         window.addEventListener('scroll', updatePosition, true);
// //         return () => {
// //             window.removeEventListener('resize', updatePosition);
// //             window.removeEventListener('scroll', updatePosition, true);
// //         };
// //     }, [isHistoryOpen]);

// //     /* Close history dropdown on outside click / Escape */
// //     useEffect(() => {
// //         if (!isHistoryOpen) return;

// //         const onPointerDown = (event: MouseEvent | TouchEvent) => {
// //             const target = event.target as Node;
// //             if (historyToggleRef.current?.contains(target)) return;
// //             if (target instanceof Element && target.closest('.ai-chat-history-dropdown')) return;
// //             setIsHistoryOpen(false);
// //         };

// //         const onKeyDown = (event: globalThis.KeyboardEvent) => {
// //             if (event.key === 'Escape') setIsHistoryOpen(false);
// //         };

// //         const bindTimer = window.setTimeout(() => {
// //             document.addEventListener('mousedown', onPointerDown);
// //             document.addEventListener('touchstart', onPointerDown);
// //             document.addEventListener('keydown', onKeyDown);
// //         }, 0);

// //         return () => {
// //             window.clearTimeout(bindTimer);
// //             document.removeEventListener('mousedown', onPointerDown);
// //             document.removeEventListener('touchstart', onPointerDown);
// //             document.removeEventListener('keydown', onKeyDown);
// //         };
// //     }, [isHistoryOpen]);

// //     /* Grow textarea with content */
// //     const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
// //         setInputText(e.target.value);
// //         const el = e.target;
// //         el.style.height = 'auto';
// //         const needsScroll = el.scrollHeight > 120;
// //         el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
// //         // Only allow a scrollbar once the field hits max height (avoids the black line)
// //         el.classList.toggle('is-scrollable', needsScroll);
// //     };

// //     const handleSend = useCallback(async () => {
// //         const text = inputText.trim();
// //         if (!text || composerDisabled) return;
// //         setInputText('');

// //         if (textareaRef.current) {
// //             textareaRef.current.style.height = 'auto';
// //             textareaRef.current.classList.remove('is-scrollable');
// //         }

// //         await sendMessage(text);
// //         setIsHistoryOpen(false);
// //     }, [composerDisabled, inputText, sendMessage]);

// //     const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
// //         if (e.key === 'Enter' && !e.shiftKey) {
// //             e.preventDefault();
// //             void handleSend();
// //         }
// //     };

// //     const handleNewChat = () => {
// //         resetChat();
// //         setInputText('');
// //         if (textareaRef.current) {
// //             textareaRef.current.style.height = 'auto';
// //             textareaRef.current.focus();
// //         }
// //         setIsHistoryOpen(false);
// //     };

// //     const handleClose = () => {
// //         setIsAiChatOpen(false);
// //     };

// //     const handleSelectConversation = async (conversationId: string) => {
// //         await openConversation(conversationId);
// //         setInputText('');
// //         if (textareaRef.current) {
// //             textareaRef.current.style.height = 'auto';
// //         }
// //         setIsHistoryOpen(false);
// //     };

// //     /* Don't render the panel at all if feature is disabled */
// //     if (!userPermissions?.aiFeatures) return null;

// //     /* Determine which assistant messages are "last" for thumbs display */
// //     const lastAssistantIndex = messages.reduceRight(
// //         (acc, m, i) => (acc === -1 && m.role === 'assistant' ? i : acc),
// //         -1,
// //     );

// //     return (
// //         <>
// //             {/* Mobile backdrop (full-screen panel ≤767px) */}
// //             {isMobilebig && isAiChatOpen && (
// //                 <div className="ai-chat-backdrop" onClick={handleClose} aria-hidden="true" />
// //             )}

// //             {isHistoryOpen &&
// //                 historyDropdownPos &&
// //                 typeof document !== 'undefined' &&
// //                 createPortal(
// //                     <HistoryDropdown
// //                         conversations={conversations}
// //                         activeConversationId={activeConversationId}
// //                         isLoadingHistory={isLoadingHistory}
// //                         isLoadingMoreHistory={isLoadingMoreHistory}
// //                         hasMore={Boolean(nextCursor)}
// //                         position={historyDropdownPos}
// //                         onSelect={(id) => void handleSelectConversation(id)}
// //                         onDelete={(id) => void deleteConversation(id)}
// //                         onLoadMore={loadMoreConversations}
// //                     />,
// //                     document.body,
// //                 )}

// //             <aside
// //                 className={`ai-chat-panel${isAiChatOpen ? ' is-open' : ''}`}
// //                 role="complementary"
// //                 aria-label="Find in mail — AI chat"
// //                 aria-hidden={!isAiChatOpen}
// //             >
// //                 {/* ── Header ── */}
// //                 <div className="ai-chat-panel__header">
// //                     <div className="ai-chat-panel__title-wrap">
// //                         <h2 className="ai-chat-panel__title">Find in mail</h2>
// //                         <span className="ai-chat-panel__shortcut" title="Keyboard shortcut">
// //                             Ctrl+D
// //                         </span>
// //                     </div>
// //                     <div className="ai-chat-panel__header-actions">
// //                         <button
// //                             type="button"
// //                             className="ai-chat-panel__new-btn hover-link  icon-hover-effect"
// //                             onClick={handleNewChat}
// //                             title="Start a new conversation"
// //                         >
// //                             <InteractiveIcon
// //                                 defaultIcon={folderIcon}
// //                                 hoverIcon={folderIconHover}
// //                                 activeIcon=""
// //                                 isActive={false}
// //                                 alt=""
// //                                 className="interactive-icon hover-image"
// //                                 renderAs="img"
// //                                 tooltip="New chat"
// //                             />
// //                         </button>
// //                         <div className="ai-chat-panel__history-wrap" ref={historyToggleRef}>
// //                             <button
// //                                 type="button"
// //                                 className={`ai-chat-panel__history-toggle hover-link  icon-hover-effect ${isHistoryOpen ? ' is-active' : ''}`}
// //                                 onClick={() => setIsHistoryOpen((open) => !open)}
// //                                 aria-pressed={isHistoryOpen}
// //                                 aria-expanded={isHistoryOpen}
// //                                 aria-haspopup="menu"
// //                                 aria-label={isHistoryOpen ? 'Hide chat history' : 'Show chat history'}
// //                             >
// //                                 <InteractiveIcon
// //                                     defaultIcon={historyIcon}
// //                                     hoverIcon={historyIconHover}
// //                                     activeIcon=""
// //                                     isActive={false}
// //                                     alt=""
// //                                     className="interactive-icon hover-image"
// //                                     renderAs="img"
// //                                     tooltip="Chat history"
// //                                 />
// //                             </button>
// //                         </div>

// //                         <button
// //                             type="button"
// //                             className="ai-chat-panel__close-btn"
// //                             onClick={handleClose}
// //                             aria-label="Close AI chat panel"
// //                         >
// //                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
// //                                 <line x1="18" y1="6" x2="6" y2="18" />
// //                                 <line x1="6" y1="6" x2="18" y2="18" />
// //                             </svg>
// //                         </button>
// //                     </div>
// //                 </div>

// //                 <div className="ai-chat-panel__content">
// //                     <div className="ai-chat-panel__chat">
// //                         {/* ── Body ── */}
// //                         <div className="ai-chat-panel__body" ref={bodyRef}>
// //                             {isOpeningConversation ? (
// //                                 <div className="ai-chat-loading" aria-live="polite" aria-busy="true">
// //                                     <span
// //                                         className="spinner-border spinner-border-sm text-primary"
// //                                         role="status"
// //                                     />
// //                                     <span>Opening chat…</span>
// //                                 </div>
// //                             ) : messages.length === 0 && !isLoading ? (
// //                                 <div className="ai-chat-empty">
// //                                     <svg className="ai-chat-empty__icon" viewBox="0 0 24 24" fill="none" stroke="#717d84" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
// //                                         <circle cx="11" cy="11" r="8" />
// //                                         <line x1="21" y1="21" x2="16.65" y2="16.65" />
// //                                         <path d="M11 8v3l2 2" />
// //                                     </svg>
// //                                     <p className="ai-chat-empty__title">Ask about your mail</p>
// //                                     <p className="ai-chat-empty__hint">
// //                                         Answers are limited to emails in your currently open folder
// //                                         {' '}(<strong>{openFolderLabel}</strong>).
// //                                     </p>
// //                                 </div>
// //                             ) : (
// //                                 <>
// //                                     {messages.map((msg, i) => (
// //                                         <MessageItem
// //                                             key={i}
// //                                             msg={msg}
// //                                             isLast={i === lastAssistantIndex}
// //                                             thumbs={i === lastAssistantIndex ? thumbs : null}
// //                                             onThumbsClick={sendThumbsFeedback}
// //                                             onShowSources={showCitationsInMailList}
// //                                         />
// //                                     ))}

// //                                     {isLoading && (
// //                                         <div className="ai-chat-loading" aria-live="polite" aria-busy="true">
// //                                             <span
// //                                                 className="spinner-border spinner-border-sm text-primary"
// //                                                 role="status"
// //                                             />
// //                                             <span>Searching your mailbox…</span>
// //                                         </div>
// //                                     )}
// //                                 </>
// //                             )}
// //                         </div>

// //                         {/* ── Footer ── */}
// //                         <div className="ai-chat-panel__footer">
// //                             <p className="ai-chat-disclaimer">
// //                                 Answers come from retrieved mailbox emails. Open the source to verify.
// //                             </p>
// //                             <div className="ai-chat-input-row">
// //                                 <div className="ai-chat-input-wrap">
// //                                     <textarea
// //                                         ref={textareaRef}
// //                                         className="form-control ai-chat-panel__textarea"
// //                                         placeholder="Ask about your emails…"
// //                                         value={inputText}
// //                                         rows={1}
// //                                         onChange={handleTextareaChange}
// //                                         onKeyDown={handleKeyDown}
// //                                         disabled={composerDisabled}
// //                                         aria-label="Message input"
// //                                     />
// //                                 </div>
// //                                 <button
// //                                     type="button"
// //                                     className={`btn-new ai-chat-panel__send-btn${inputText.trim() ? ' has-prompt' : ''}`}
// //                                     onClick={() => void handleSend()}
// //                                     disabled={composerDisabled || !inputText.trim()}
// //                                     aria-label="Send message"
// //                                 >
// //                                     <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
// //                                         <path d="M3 4L19 11L3 18L4.99889 11H10.4989H4.99997L3 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
// //                                     </svg>
// //                                 </button>
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </aside>
// //         </>
// //     );
// // }



// import {
//     memo,
//     useCallback,
//     useEffect,
//     useLayoutEffect,
//     useMemo,
//     useRef,
//     useState,
//     type CSSProperties,
//     type KeyboardEvent,
//     type RefObject,
// } from 'react';
// import { createPortal } from 'react-dom';
// import { useAccount } from '@context/AccountContext';
// import { useMailUI } from '@context/MailUIContext';
// import { useMailData } from '@context/index';
// import { useScreen } from '@context/ScreenContext';
// import deleteIconHover from "@images/trash-icon-hover.svg";
// import deleteIcon from "@images/trash-icon.svg";
// import historyIcon from "@images/history-icon.svg";
// import historyIconHover from "@images/history-icon-hover.svg"
// import folderIcon from "@images/plus-icon.svg";
// import folderIconHover from "@images/plus-icon-hover.svg";
// import InteractiveIcon from '../InteractiveIcon';
// import {
//     useAiChat,
//     type AiChatAssistantMessage,
//     type AiChatMessage,
// } from '@hooks/useAiChat';
// import type { AiChatCitation, AiChatConversationSummary } from '@services/aiService/aiChatService';
// import { AiChatMarkdown } from '@utils/aiChatMarkdown';
// import {
//     AI_SOURCES_BOX_TITLE,
//     buildAiSourcesPagination,
//     mapAiCitationsToEmails,
// } from '@utils/aiChatCitationUtil';

// /* ─── Design switches ─────────────────────────────────────── */
// /** Show the email cards (filters, "Show N more emails") inside the assistant bubble. */
// const SHOW_SOURCE_CARDS = true;
// /** How many cards are visible before the "Show N more emails" button. */
// const CARDS_COLLAPSED_COUNT = 3;

// /* Markdown is memoised so unrelated re-renders (typing in the composer, etc.)
//    never rebuild the DOM while the typewriter is working on it. */
// const MemoMarkdown = memo(AiChatMarkdown);

// /*
//  * When the email cards are shown, the numbered list the backend writes into
//  * the answer (and its bullet lines) would repeat the same emails. Remove it
//  * and keep only the intro / summary text.
//  */
// function stripEmailList(answer: string, count: number): string {
//     const kept: string[] = [];
//     let inList = false;
//     for (const line of answer.split('\n')) {
//         if (/^\s*\d+[.)]\s+/.test(line)) {
//             if (!inList) {
//                 // The heading that introduced this list ("Details", ...) goes too.
//                 while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
//                 if (kept.length && /^#{1,6}\s/.test(kept[kept.length - 1])) kept.pop();
//             }
//             inList = true;
//             continue;
//         }
//         if (inList && (/^\s*[-*•]\s+/.test(line) || !line.trim())) continue;
//         inList = false;
//         kept.push(line);
//     }

//     // Drop headings that no longer have any content under them.
//     const cleaned = kept.filter((line, i) => {
//         if (!/^#{1,6}\s/.test(line)) return true;
//         const next = kept.slice(i + 1).find((l) => l.trim());
//         return Boolean(next) && !/^#{1,6}\s/.test(next as string);
//     });

//     const text = cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
//     if (text) return text;
//     return count === 1
//         ? 'Here is the matching email.'
//         : `Here are the ${count} matching emails.`;
// }

// /* ─── Status copy helpers ─────────────────────────────────── */
// function getStatusCopy(msg: AiChatAssistantMessage): string | null {
//     switch (msg.status) {
//         case 'not_found':
//             return "I couldn't find any emails that match your question.";
//         case 'needs_clarification':
//             return msg.clarifyingQuestion ?? 'Could you give me a bit more detail?';
//         case 'refused':
//             return "I can only help with read-only questions about your mailbox.";
//         default:
//             return null;
//     }
// }

// /* ─── Typewriter (letter by letter) ───────────────────────── */
// /*
//  * Works on the DOM that React already rendered, so markdown (lists, bold,
//  * italics, code) keeps its real layout. Text nodes are emptied and then
//  * revealed a few characters per frame; blocks stay hidden until their first
//  * letter is typed. Click on the text to skip the animation.
//  */
// function useTypewriter(
//     ref: RefObject<HTMLElement | null>,
//     enabled: boolean,
//     onTick: () => void,
//     onDone: () => void,
// ) {
//     const onTickRef = useRef(onTick);
//     const onDoneRef = useRef(onDone);
//     onTickRef.current = onTick;
//     onDoneRef.current = onDone;

//     useLayoutEffect(() => {
//         const root = ref.current;
//         if (!enabled || !root) return;

//         const reduceMotion =
//             typeof window !== 'undefined' &&
//             typeof window.matchMedia === 'function' &&
//             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
//         if (reduceMotion) {
//             onDoneRef.current();
//             return;
//         }

//         const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
//         const nodes: Text[] = [];
//         let current: Node | null = walker.nextNode();
//         while (current) {
//             const textNode = current as Text;
//             if (textNode.data.trim().length > 0) nodes.push(textNode);
//             current = walker.nextNode();
//         }

//         const full = nodes.map((node) => node.data);
//         const total = full.reduce((sum, text) => sum + text.length, 0);
//         if (!total) {
//             onDoneRef.current();
//             return;
//         }

//         const ancestors = nodes.map((node) => {
//             const list: HTMLElement[] = [];
//             let parent = node.parentElement;
//             while (parent && parent !== root) {
//                 list.push(parent);
//                 parent = parent.parentElement;
//             }
//             return list;
//         });

//         ancestors.forEach((list) => list.forEach((el) => { el.style.display = 'none'; }));
//         nodes.forEach((node) => { node.data = ''; });

//         const caret = document.createElement('span');
//         caret.className = 'ai-chat-caret';
//         caret.setAttribute('aria-hidden', 'true');

//         const duration = Math.min(6000, Math.max(1400, total * 12));
//         const step = Math.max(1, Math.ceil(total / (duration / 16)));
//         let nodeIndex = 0;
//         let charIndex = 0;
//         let finished = false;
//         let timer = 0;

//         const finish = (notify: boolean) => {
//             if (finished) return;
//             finished = true;
//             window.clearInterval(timer);
//             nodes.forEach((node, i) => { node.data = full[i]; });
//             ancestors.forEach((list) => list.forEach((el) => { el.style.display = ''; }));
//             caret.remove();
//             root.removeEventListener('click', skip);
//             if (notify) onDoneRef.current();
//         };
//         const skip = () => finish(true);

//         const tick = () => {
//             let left = step;
//             while (left > 0 && nodeIndex < nodes.length) {
//                 const text = full[nodeIndex];
//                 if (charIndex === 0) {
//                     ancestors[nodeIndex].forEach((el) => { el.style.display = ''; });
//                 }
//                 const take = Math.min(left, text.length - charIndex);
//                 charIndex += take;
//                 left -= take;
//                 nodes[nodeIndex].data = text.slice(0, charIndex);
//                 if (charIndex >= text.length) {
//                     nodeIndex += 1;
//                     charIndex = 0;
//                 }
//             }
//             const anchorIndex =
//                 charIndex === 0 && nodeIndex > 0 ? nodeIndex - 1 : Math.min(nodeIndex, nodes.length - 1);
//             const anchor = nodes[anchorIndex];
//             anchor.parentNode?.insertBefore(caret, anchor.nextSibling);
//             onTickRef.current();
//             if (nodeIndex >= nodes.length) finish(true);
//         };

//         root.addEventListener('click', skip);
//         timer = window.setInterval(tick, 16);
//         return () => finish(false);
//     }, [enabled, ref]);
// }

// /* ─── Source cards (design: filters + mail cards) ─────────── */
// type CardTone = 'g' | 'a' | 'p' | 'b';

// interface CitationView {
//     key: string;
//     citation: AiChatCitation;
//     sender: string;
//     fromFull: string;
//     initials: string;
//     subject: string;
//     snippet: string;
//     dateText: string;
//     label: string;
//     tone: CardTone;
// }

// const TONES: CardTone[] = ['g', 'b', 'p', 'a'];
// const LABEL_TONE_HINTS: Array<[RegExp, CardTone]> = [
//     [/invit|event|meeting/i, 'g'],
//     [/log|error|alert|attach/i, 'a'],
//     [/calendar|schedul/i, 'p'],
//     [/design|update|promo/i, 'b'],
// ];

// function pickString(source: Record<string, unknown>, keys: string[]): string {
//     for (const key of keys) {
//         const value = source[key];
//         if (typeof value === 'string' && value.trim()) return value.trim();
//     }
//     return '';
// }

// function pickLabel(source: Record<string, unknown>): string {
//     const single = pickString(source, ['label', 'aiLabel', 'ai_label', 'category']);
//     if (single) return single;
//     const list = source.labels ?? source.aiLabels ?? source.ai_labels;
//     if (Array.isArray(list) && list.length > 0) {
//         const first: unknown = list[0];
//         if (typeof first === 'string') return first.trim();
//         if (first && typeof first === 'object') {
//             return pickString(first as Record<string, unknown>, ['name', 'label', 'title']);
//         }
//     }
//     return '';
// }

// function senderName(raw: string): string {
//     // "Prit Dedaniya <prit.d@x.com>" -> "Prit Dedaniya", "raj.v@mail.x.com" -> "raj.v"
//     const match = raw.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
//     if (match && match[1].trim()) return match[1].trim();
//     const address = match ? match[2] : raw;
//     const at = address.indexOf('@');
//     return at > 0 ? address.slice(0, at) : address;
// }

// function getInitials(name: string): string {
//     const parts = name.split(/[\s._-]+/).filter(Boolean);
//     if (parts.length === 0) return '?';
//     const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0];
//     return letters.toUpperCase();
// }

// function hashTone(seed: string): CardTone {
//     let hash = 0;
//     for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
//     return TONES[hash % TONES.length];
// }

// function toneFor(label: string, sender: string): CardTone {
//     if (label) {
//         const hint = LABEL_TONE_HINTS.find(([pattern]) => pattern.test(label));
//         if (hint) return hint[1];
//         return hashTone(label);
//     }
//     return hashTone(sender);
// }

// function formatCardDate(value: unknown): string {
//     if (value === null || value === undefined || value === '') return '';
//     const date = value instanceof Date ? value : new Date(value as string | number);
//     if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
//     const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
//     const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
//     return `${day} · ${time}`;
// }

// /*
//  * Single place that reads the citation fields. If your AiChatCitation uses
//  * different property names, add them to the key lists below.
//  */
// function toCitationView(citation: AiChatCitation, index: number): CitationView {
//     const source = citation as unknown as Record<string, unknown>;
//     const fromFull = pickString(source, [
//         'from', 'fromName', 'from_name', 'sender', 'senderName', 'fromEmail', 'from_email',
//     ]);
//     const sender = senderName(fromFull) || 'Unknown sender';
//     const label = pickLabel(source);
//     const id = pickString(source, ['messageId', 'message_id', 'id', 'uid']);
//     return {
//         key: id ? `${id}-${index}` : String(index),
//         citation,
//         sender,
//         fromFull: fromFull || sender,
//         initials: getInitials(sender),
//         subject: pickString(source, ['subject', 'title']) || '(no subject)',
//         snippet: pickString(source, ['snippet', 'preview', 'excerpt', 'bodyPreview', 'summary', 'text']),
//         dateText: formatCardDate(
//             source.date ?? source.receivedAt ?? source.received_at ?? source.sentAt ?? source.timestamp ?? source.createdAt,
//         ),
//         label,
//         tone: toneFor(label, sender),
//     };
// }

// interface SourceCardsProps {
//     citations: AiChatCitation[];
//     onOpenInMailList: (citations: AiChatCitation[]) => void;
// }

// function SourceCards({ citations, onOpenInMailList }: SourceCardsProps) {
//     const items = useMemo(() => citations.map(toCitationView), [citations]);
//     const [filter, setFilter] = useState('All');
//     const [expanded, setExpanded] = useState(false);
//     const [openKey, setOpenKey] = useState<string | null>(null);

//     const labelCounts = useMemo(() => {
//         const counts = new Map<string, number>();
//         items.forEach((item) => {
//             if (item.label) counts.set(item.label, (counts.get(item.label) ?? 0) + 1);
//         });
//         return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
//     }, [items]);

//     const visible = filter === 'All' ? items : items.filter((item) => item.label === filter);
//     const shown = expanded ? visible : visible.slice(0, CARDS_COLLAPSED_COUNT);
//     const hiddenCount = visible.length - shown.length;

//     return (
//         <div className="ai-chat-sources">
//             {labelCounts.length > 1 && (
//                 <div className="ai-chat-filters" role="group" aria-label="Filter emails by label">
//                     {[['All', items.length] as [string, number], ...labelCounts].map(([name, count]) => (
//                         <button
//                             key={name}
//                             type="button"
//                             className={`ai-chat-filter${filter === name ? ' is-active' : ''}`}
//                             aria-pressed={filter === name}
//                             onClick={() => {
//                                 setFilter(name);
//                                 setExpanded(false);
//                             }}
//                         >
//                             {name}
//                             <em>{count}</em>
//                         </button>
//                     ))}
//                 </div>
//             )}

//             <ul className="ai-chat-mail-cards">
//                 {shown.map((item, i) => {
//                     const isOpen = openKey === item.key;
//                     return (
//                         <li
//                             key={item.key}
//                             className={`ai-chat-mail-card tone-${item.tone}${isOpen ? ' is-open' : ''}`}
//                             style={{ '--i': i } as CSSProperties}
//                         >
//                             <button
//                                 type="button"
//                                 className="ai-chat-mail-card__main"
//                                 aria-expanded={isOpen}
//                                 onClick={() => setOpenKey(isOpen ? null : item.key)}
//                             >
//                                 <span className="ai-chat-mail-card__avatar" aria-hidden="true">
//                                     {item.initials}
//                                 </span>
//                                 <span className="ai-chat-mail-card__body">
//                                     <span className="ai-chat-mail-card__meta">
//                                         <span className="ai-chat-mail-card__from">{item.sender}</span>
//                                         {item.label && (
//                                             <span className="ai-chat-mail-card__pill">{item.label}</span>
//                                         )}
//                                         {item.dateText && (
//                                             <span className="ai-chat-mail-card__date">{item.dateText}</span>
//                                         )}
//                                     </span>
//                                     <span className="ai-chat-mail-card__subject">{item.subject}</span>
//                                     {item.snippet && (
//                                         <span className="ai-chat-mail-card__snippet">{item.snippet}</span>
//                                     )}
//                                 </span>
//                             </button>

//                             {isOpen && (
//                                 <div className="ai-chat-mail-card__detail">
//                                     <dl className="ai-chat-mail-card__facts">
//                                         <dt>From</dt>
//                                         <dd>{item.fromFull}</dd>
//                                         {item.label && (
//                                             <>
//                                                 <dt>Label</dt>
//                                                 <dd>{item.label}</dd>
//                                             </>
//                                         )}
//                                         {item.dateText && (
//                                             <>
//                                                 <dt>Received</dt>
//                                                 <dd>{item.dateText}</dd>
//                                             </>
//                                         )}
//                                     </dl>
//                                     <button
//                                         type="button"
//                                         className="ai-chat-mail-card__open"
//                                         onClick={() => onOpenInMailList([item.citation])}
//                                         title="List this email in the mail panel"
//                                     >
//                                         Open in mail list
//                                     </button>
//                                 </div>
//                             )}
//                         </li>
//                     );
//                 })}
//             </ul>

//             {(hiddenCount > 0 || (expanded && visible.length > CARDS_COLLAPSED_COUNT)) && (
//                 <button
//                     type="button"
//                     className="ai-chat-more-btn"
//                     onClick={() => setExpanded((open) => !open)}
//                 >
//                     {expanded ? 'Show fewer emails' : `Show ${hiddenCount} more emails`}
//                 </button>
//             )}
//         </div>
//     );
// }

// /* ─── Loader replacement: animated gradient border ────────── */
// function SearchingCard({ text }: { text: string }) {
//     return (
//         <div
//             className="ai-chat-loading ai-chat-loading--glow"
//             role="status"
//             aria-live="polite"
//             aria-busy="true"
//         >
//             <span className="ai-chat-loading__text">{text}</span>
//         </div>
//     );
// }

// /* ─── Messages ────────────────────────────────────────────── */
// interface MessageItemProps {
//     msg: AiChatMessage;
//     isLast: boolean;
//     thumbs: 'up' | 'down' | null;
//     onThumbsClick: (value: 'up' | 'down') => void;
//     onShowSources: (citations: AiChatCitation[]) => void;
//     /** True only for the answer that just arrived, so it types out. */
//     animate: boolean;
//     onTypingTick: () => void;
// }

// function AssistantMessageItem({
//     msg,
//     animate,
//     onTypingTick,
//     onShowSources,
// }: {
//     msg: AiChatAssistantMessage;
//     animate: boolean;
//     onTypingTick: () => void;
//     onShowSources: (citations: AiChatCitation[]) => void;
// }) {
//     const statusCopy = getStatusCopy(msg);
//     const citations = msg.citations ?? [];
//     const sourceCount = citations.length;
//     const [done, setDone] = useState(!animate);
//     const textRef = useRef<HTMLDivElement>(null);

//     useEffect(() => {
//         if (!animate) setDone(true);
//     }, [animate]);

//     const handleDone = useCallback(() => setDone(true), []);
//     useTypewriter(textRef, animate && !done, onTypingTick, handleDone);

//     const hasCards = SHOW_SOURCE_CARDS && sourceCount > 0;
//     const answerText = useMemo(() => {
//         if (!msg.answer) return '';
//         return hasCards ? stripEmailList(msg.answer, sourceCount) : msg.answer;
//     }, [msg.answer, hasCards, sourceCount]);

//     return (
//         <div className="ai-chat-message ai-chat-message--assistant">
//             <span className="ai-chat-message__label">Mailspot assistant</span>

//             {/* Answer text or status message */}
//             {msg.answer ? (
//                 <div
//                     className={`ai-chat-message__bubble ai-chat-message__bubble--md${hasCards ? ' ai-chat-message__bubble--wide' : ''}`}
//                 >
//                     <div ref={textRef} className="ai-chat-typewriter">
//                         <MemoMarkdown text={answerText} />
//                     </div>
//                     {hasCards && done && (
//                         <SourceCards citations={citations} onOpenInMailList={onShowSources} />
//                     )}
//                 </div>
//             ) : statusCopy ? (
//                 <div ref={textRef} className="ai-chat-status">{statusCopy}</div>
//             ) : null}

//             {sourceCount > 0 && done && (
//                 <button
//                     type="button"
//                     className="btn-new ai-chat-show-sources-btn"
//                     onClick={() => onShowSources(citations)}
//                     title="List source emails in the mail panel"
//                 >
//                     Show sources ({sourceCount})
//                 </button>
//             )}
//         </div>
//     );
// }

// function MessageItem({
//     msg,
//     isLast: _isLast,
//     thumbs: _thumbs,
//     onThumbsClick: _onThumbsClick,
//     onShowSources,
//     animate,
//     onTypingTick,
// }: MessageItemProps) {
//     if (msg.role === 'user') {
//         return (
//             <div className="ai-chat-message ai-chat-message--user">
//                 <span className="ai-chat-message__label">You</span>
//                 <div className="ai-chat-message__bubble">{msg.text}</div>
//             </div>
//         );
//     }

//     return (
//         <AssistantMessageItem
//             msg={msg}
//             animate={animate}
//             onTypingTick={onTypingTick}
//             onShowSources={onShowSources}
//         />
//     );
// }

// interface HistoryDropdownProps {
//     conversations: AiChatConversationSummary[];
//     activeConversationId: string | null;
//     isLoadingHistory: boolean;
//     isLoadingMoreHistory: boolean;
//     hasMore: boolean;
//     position: { top: number; left: number };
//     onSelect: (conversationId: string) => void;
//     onDelete: (conversationId: string) => void;
//     onLoadMore: () => void;
// }

// function HistoryDropdown({
//     conversations,
//     activeConversationId,
//     isLoadingHistory,
//     isLoadingMoreHistory,
//     hasMore,
//     position,
//     onSelect,
//     onDelete,
//     onLoadMore,
// }: HistoryDropdownProps) {
//     return (
//         <div
//             className="ai-chat-history-dropdown"
//             role="menu"
//             aria-label="Previous chats"
//             style={{ top: position.top, left: position.left }}
//         >
//             <div className="ai-chat-history-dropdown__header">Previous</div>

//             <div className="ai-chat-history-dropdown__list">
//                 {isLoadingHistory && conversations.length === 0 ? (
//                     <div className="ai-chat-history-dropdown__empty" role="status">
//                         <span
//                             className="spinner-border spinner-border-sm text-primary"
//                             role="status"
//                         />
//                         <span>Loading…</span>
//                     </div>
//                 ) : conversations.length === 0 ? (
//                     <div className="ai-chat-history-dropdown__empty">No past chats</div>
//                 ) : (
//                     conversations.map((item) => {
//                         const isActive = item.conversationId === activeConversationId;
//                         const title = item.title?.trim() || 'Untitled chat';
//                         return (
//                             <div
//                                 key={item.conversationId}
//                                 className={`ai-chat-history-dropdown__item${isActive ? ' is-active' : ''}`}
//                                 role="none"
//                             >
//                                 <button
//                                     type="button"
//                                     className="ai-chat-history-dropdown__item-btn"
//                                     role="menuitem"
//                                     onClick={() => onSelect(item.conversationId)}
//                                     title={title}
//                                 >
//                                     <span className="ai-chat-history-dropdown__item-title">
//                                         {title}
//                                     </span>
//                                 </button>
//                                 <button
//                                     type="button"
//                                     className="ai-chat-history-dropdown__delete-btn hover-link icon-hover-effect"
//                                     onClick={(event) => {
//                                         event.preventDefault();
//                                         event.stopPropagation();
//                                         void onDelete(item.conversationId);
//                                     }}
//                                     aria-label={`Delete chat: ${title}`}
//                                 >
//                                     <InteractiveIcon
//                                         defaultIcon={deleteIcon}
//                                         hoverIcon={deleteIconHover}
//                                         activeIcon=""
//                                         isActive={false}
//                                         alt=""
//                                         className="interactive-icon hover-image"
//                                         renderAs="img"
//                                         tooltip="Delete chat"
//                                     />
//                                 </button>
//                             </div>
//                         );
//                     })
//                 )}

//                 {hasMore && (
//                     <button
//                         type="button"
//                         className="btn-new ai-chat-history-dropdown__load-more"
//                         onClick={() => void onLoadMore()}
//                         disabled={isLoadingMoreHistory}
//                     >
//                         {isLoadingMoreHistory ? 'Loading…' : 'Load more'}
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// }

// /* ─── Main panel component ────────────────────────────────── */
// export default function AiChatPanel() {
//     const { isAiChatOpen, setIsAiChatOpen } = useMailUI();
//     const { activeAccountId } = useAccount();
//     const {
//         userPermissions,
//         setEmailDetailSelected,
//         setActiveEmailMessageId,
//         setEmails,
//         setPagination,
//         setTotalEmailBadge,
//         setBoxTitle,
//         setAllSearchResult,
//         boxName,
//         boxTitle,
//     } = useMailData();

//     const openFolderLabel = (boxTitle || boxName || 'this folder').trim();
//     const { setIsMailListOpen, setToolbarState } = useMailUI();
//     const { isMobilebig, isDesktop } = useScreen();

//     const {
//         messages,
//         isLoading,
//         thumbs,
//         sendMessage,
//         resetChat,
//         sendThumbsFeedback,
//         conversations,
//         nextCursor,
//         isLoadingHistory,
//         isLoadingMoreHistory,
//         isOpeningConversation,
//         composerDisabled,
//         activeConversationId,
//         loadConversations,
//         loadMoreConversations,
//         openConversation,
//         deleteConversation,
//     } = useAiChat({ currentBoxName: boxName });

//     const [inputText, setInputText] = useState('');
//     const [isHistoryOpen, setIsHistoryOpen] = useState(false);
//     const [historyDropdownPos, setHistoryDropdownPos] = useState<{ top: number; left: number } | null>(null);
//     const bodyRef = useRef<HTMLDivElement>(null);
//     const textareaRef = useRef<HTMLTextAreaElement>(null);
//     const historyToggleRef = useRef<HTMLDivElement>(null);

//     /* Typewriter bookkeeping: which message index just arrived and should type out. */
//     const freshIndexRef = useRef(-1);
//     const pendingAnswerRef = useRef(false);
//     const sentLengthRef = useRef(0);

//     /* Push AI source citations into the main mail list (like search results) — only on button click. */
//     const showCitationsInMailList = useCallback(
//         (citations: AiChatCitation[]) => {
//             if (!citations.length) return;

//             const listEmails = mapAiCitationsToEmails(citations);
//             setAllSearchResult(true);
//             setEmails(listEmails);
//             setPagination(buildAiSourcesPagination(listEmails.length));
//             setTotalEmailBadge(listEmails.length);
//             setBoxTitle(AI_SOURCES_BOX_TITLE);
//             setEmailDetailSelected(null);
//             setActiveEmailMessageId(null);
//             setToolbarState({
//                 showBack: false,
//                 showSelectAll: true,
//                 showRefresh: true,
//                 showDelete: false,
//                 showMarkAsRead: false,
//                 showMarkAsUnread: false,
//                 showMove: false,
//             });

//             if (!isDesktop) {
//                 setIsMailListOpen(true);
//             }
//         },
//         [
//             isDesktop,
//             setActiveEmailMessageId,
//             setAllSearchResult,
//             setBoxTitle,
//             setEmailDetailSelected,
//             setEmails,
//             setIsMailListOpen,
//             setPagination,
//             setToolbarState,
//             setTotalEmailBadge,
//         ],
//     );

//     /* Keep the newest text in view while the answer types out. */
//     const handleTypingTick = useCallback(() => {
//         const el = bodyRef.current;
//         if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
//             el.scrollTop = el.scrollHeight;
//         }
//     }, []);

//     /* Account switch: clear local composer UI and close the panel (hook clears transcript/history). */
//     useEffect(() => {
//         setInputText('');
//         setIsHistoryOpen(false);
//         freshIndexRef.current = -1;
//         pendingAnswerRef.current = false;
//         if (textareaRef.current) {
//             textareaRef.current.style.height = 'auto';
//             textareaRef.current.classList.remove('is-scrollable');
//         }
//         setIsAiChatOpen(false);
//     }, [activeAccountId, setIsAiChatOpen]);

//     /* Load first history page whenever the panel opens; keep history closed until the user opens it. */
//     useEffect(() => {
//         if (!isAiChatOpen) {
//             setIsHistoryOpen(false);
//             return;
//         }
//         setIsHistoryOpen(false);
//         void loadConversations();
//     }, [isAiChatOpen, loadConversations]);

//     /* Auto-scroll to bottom on new messages */
//     useEffect(() => {
//         if (bodyRef.current) {
//             bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
//         }
//     }, [messages, isLoading, isOpeningConversation]);

//     /* Focus textarea when panel opens */
//     useEffect(() => {
//         if (isAiChatOpen && !composerDisabled) {
//             setTimeout(() => textareaRef.current?.focus(), 100);
//         }
//     }, [isAiChatOpen, composerDisabled]);

//     /* Position history dropdown under the toggle (portaled; panel overflow clips otherwise). */
//     useLayoutEffect(() => {
//         if (!isHistoryOpen) {
//             setHistoryDropdownPos(null);
//             return;
//         }

//         const updatePosition = () => {
//             const anchor = historyToggleRef.current;
//             if (!anchor) return;
//             const rect = anchor.getBoundingClientRect();
//             const dropdownWidth = Math.min(280, window.innerWidth - 24);
//             let left = rect.left;
//             left = Math.min(left, window.innerWidth - dropdownWidth - 8);
//             left = Math.max(8, left);
//             setHistoryDropdownPos({
//                 top: rect.bottom + 8,
//                 left,
//             });
//         };

//         updatePosition();
//         window.addEventListener('resize', updatePosition);
//         window.addEventListener('scroll', updatePosition, true);
//         return () => {
//             window.removeEventListener('resize', updatePosition);
//             window.removeEventListener('scroll', updatePosition, true);
//         };
//     }, [isHistoryOpen]);

//     /* Close history dropdown on outside click / Escape */
//     useEffect(() => {
//         if (!isHistoryOpen) return;

//         const onPointerDown = (event: MouseEvent | TouchEvent) => {
//             const target = event.target as Node;
//             if (historyToggleRef.current?.contains(target)) return;
//             if (target instanceof Element && target.closest('.ai-chat-history-dropdown')) return;
//             setIsHistoryOpen(false);
//         };

//         const onKeyDown = (event: globalThis.KeyboardEvent) => {
//             if (event.key === 'Escape') setIsHistoryOpen(false);
//         };

//         const bindTimer = window.setTimeout(() => {
//             document.addEventListener('mousedown', onPointerDown);
//             document.addEventListener('touchstart', onPointerDown);
//             document.addEventListener('keydown', onKeyDown);
//         }, 0);

//         return () => {
//             window.clearTimeout(bindTimer);
//             document.removeEventListener('mousedown', onPointerDown);
//             document.removeEventListener('touchstart', onPointerDown);
//             document.removeEventListener('keydown', onKeyDown);
//         };
//     }, [isHistoryOpen]);

//     /* Grow textarea with content */
//     const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//         setInputText(e.target.value);
//         const el = e.target;
//         el.style.height = 'auto';
//         const needsScroll = el.scrollHeight > 120;
//         el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
//         // Only allow a scrollbar once the field hits max height (avoids the black line)
//         el.classList.toggle('is-scrollable', needsScroll);
//     };

//     const handleSend = useCallback(async () => {
//         const text = inputText.trim();
//         if (!text || composerDisabled) return;
//         setInputText('');

//         if (textareaRef.current) {
//             textareaRef.current.style.height = 'auto';
//             textareaRef.current.classList.remove('is-scrollable');
//         }

//         /* The next assistant message that arrives should type out. */
//         freshIndexRef.current = -1;
//         pendingAnswerRef.current = true;
//         sentLengthRef.current = messages.length;

//         await sendMessage(text);
//         setIsHistoryOpen(false);
//     }, [composerDisabled, inputText, messages.length, sendMessage]);

//     const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             void handleSend();
//         }
//     };

//     const handleNewChat = () => {
//         freshIndexRef.current = -1;
//         pendingAnswerRef.current = false;
//         resetChat();
//         setInputText('');
//         if (textareaRef.current) {
//             textareaRef.current.style.height = 'auto';
//             textareaRef.current.focus();
//         }
//         setIsHistoryOpen(false);
//     };

//     const handleClose = () => {
//         setIsAiChatOpen(false);
//     };

//     const handleSelectConversation = async (conversationId: string) => {
//         freshIndexRef.current = -1;
//         pendingAnswerRef.current = false;
//         await openConversation(conversationId);
//         setInputText('');
//         if (textareaRef.current) {
//             textareaRef.current.style.height = 'auto';
//         }
//         setIsHistoryOpen(false);
//     };

//     /* Don't render the panel at all if feature is disabled */
//     if (!userPermissions?.aiFeatures) return null;

//     /* Determine which assistant messages are "last" for thumbs display */
//     const lastAssistantIndex = messages.reduceRight(
//         (acc, m, i) => (acc === -1 && m.role === 'assistant' ? i : acc),
//         -1,
//     );

//     /* The answer that just arrived (not history) is the one that types out. */
//     const lastMessage = messages[messages.length - 1];
//     if (
//         pendingAnswerRef.current &&
//         !isLoading &&
//         lastMessage?.role === 'assistant' &&
//         messages.length > sentLengthRef.current
//     ) {
//         pendingAnswerRef.current = false;
//         freshIndexRef.current = messages.length - 1;
//     }
//     const freshIndex = freshIndexRef.current;

//     return (
//         <>
//             {/* Mobile backdrop (full-screen panel ≤767px) */}
//             {isMobilebig && isAiChatOpen && (
//                 <div className="ai-chat-backdrop" onClick={handleClose} aria-hidden="true" />
//             )}

//             {isHistoryOpen &&
//                 historyDropdownPos &&
//                 typeof document !== 'undefined' &&
//                 createPortal(
//                     <HistoryDropdown
//                         conversations={conversations}
//                         activeConversationId={activeConversationId}
//                         isLoadingHistory={isLoadingHistory}
//                         isLoadingMoreHistory={isLoadingMoreHistory}
//                         hasMore={Boolean(nextCursor)}
//                         position={historyDropdownPos}
//                         onSelect={(id) => void handleSelectConversation(id)}
//                         onDelete={(id) => void deleteConversation(id)}
//                         onLoadMore={loadMoreConversations}
//                     />,
//                     document.body,
//                 )}

//             <aside
//                 className={`ai-chat-panel${isAiChatOpen ? ' is-open' : ''}`}
//                 role="complementary"
//                 aria-label="Find in mail — AI chat"
//                 aria-hidden={!isAiChatOpen}
//             >
//                 {/* ── Header ── */}
//                 <div className="ai-chat-panel__header">
//                     <div className="ai-chat-panel__title-wrap">
//                         <h2 className="ai-chat-panel__title">Find in mail</h2>
//                         <span className="ai-chat-panel__shortcut" title="Keyboard shortcut">
//                             Ctrl+D
//                         </span>
//                     </div>
//                     <div className="ai-chat-panel__header-actions">
//                         <button
//                             type="button"
//                             className="ai-chat-panel__new-btn hover-link  icon-hover-effect"
//                             onClick={handleNewChat}
//                             title="Start a new conversation"
//                         >
//                             <InteractiveIcon
//                                 defaultIcon={folderIcon}
//                                 hoverIcon={folderIconHover}
//                                 activeIcon=""
//                                 isActive={false}
//                                 alt=""
//                                 className="interactive-icon hover-image"
//                                 renderAs="img"
//                                 tooltip="New chat"
//                             />
//                         </button>
//                         <div className="ai-chat-panel__history-wrap" ref={historyToggleRef}>
//                             <button
//                                 type="button"
//                                 className={`ai-chat-panel__history-toggle hover-link  icon-hover-effect ${isHistoryOpen ? ' is-active' : ''}`}
//                                 onClick={() => setIsHistoryOpen((open) => !open)}
//                                 aria-pressed={isHistoryOpen}
//                                 aria-expanded={isHistoryOpen}
//                                 aria-haspopup="menu"
//                                 aria-label={isHistoryOpen ? 'Hide chat history' : 'Show chat history'}
//                             >
//                                 <InteractiveIcon
//                                     defaultIcon={historyIcon}
//                                     hoverIcon={historyIconHover}
//                                     activeIcon=""
//                                     isActive={false}
//                                     alt=""
//                                     className="interactive-icon hover-image"
//                                     renderAs="img"
//                                     tooltip="Chat history"
//                                 />
//                             </button>
//                         </div>

//                         <button
//                             type="button"
//                             className="ai-chat-panel__close-btn"
//                             onClick={handleClose}
//                             aria-label="Close AI chat panel"
//                         >
//                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//                                 <line x1="18" y1="6" x2="6" y2="18" />
//                                 <line x1="6" y1="6" x2="18" y2="18" />
//                             </svg>
//                         </button>
//                     </div>
//                 </div>

//                 <div className="ai-chat-panel__content">
//                     <div className="ai-chat-panel__chat">
//                         {/* ── Body ── */}
//                         <div className="ai-chat-panel__body" ref={bodyRef}>
//                             {isOpeningConversation ? (
//                                 <SearchingCard text="Opening chat…" />
//                             ) : messages.length === 0 && !isLoading ? (
//                                 <div className="ai-chat-empty">
//                                     <svg className="ai-chat-empty__icon" viewBox="0 0 24 24" fill="none" stroke="#717d84" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//                                         <circle cx="11" cy="11" r="8" />
//                                         <line x1="21" y1="21" x2="16.65" y2="16.65" />
//                                         <path d="M11 8v3l2 2" />
//                                     </svg>
//                                     <p className="ai-chat-empty__title">Ask about your mail</p>
//                                     <p className="ai-chat-empty__hint">
//                                         Answers are limited to emails in your currently open folder
//                                         {' '}(<strong>{openFolderLabel}</strong>).
//                                     </p>
//                                 </div>
//                             ) : (
//                                 <>
//                                     {messages.map((msg, i) => (
//                                         <MessageItem
//                                             key={i}
//                                             msg={msg}
//                                             isLast={i === lastAssistantIndex}
//                                             thumbs={i === lastAssistantIndex ? thumbs : null}
//                                             onThumbsClick={sendThumbsFeedback}
//                                             onShowSources={showCitationsInMailList}
//                                             animate={i === freshIndex}
//                                             onTypingTick={handleTypingTick}
//                                         />
//                                     ))}

//                                     {isLoading && <SearchingCard text="Searching your mailbox…" />}
//                                 </>
//                             )}
//                         </div>

//                         {/* ── Footer ── */}
//                         <div className="ai-chat-panel__footer">
//                             <p className="ai-chat-disclaimer">
//                                 Answers come from retrieved mailbox emails. Open the source to verify.
//                             </p>
//                             <div className={`ai-chat-input-row${isLoading ? ' is-searching' : ''}`}>
//                                 <div className="ai-chat-input-wrap">
//                                     <textarea
//                                         ref={textareaRef}
//                                         className="form-control ai-chat-panel__textarea"
//                                         placeholder="Ask about your emails…"
//                                         value={inputText}
//                                         rows={1}
//                                         onChange={handleTextareaChange}
//                                         onKeyDown={handleKeyDown}
//                                         disabled={composerDisabled}
//                                         aria-label="Message input"
//                                     />
//                                 </div>
//                                 <button
//                                     type="button"
//                                     className={`btn-new ai-chat-panel__send-btn${inputText.trim() ? ' has-prompt' : ''}`}
//                                     onClick={() => void handleSend()}
//                                     disabled={composerDisabled || !inputText.trim()}
//                                     aria-label="Send message"
//                                 >
//                                     <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
//                                         <path d="M3 4L19 11L3 18L4.99889 11H10.4989H4.99997L3 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                                     </svg>
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </aside>
//         </>
//     );
// }


// import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
// import { createPortal } from 'react-dom';
// import { useAccount } from '@context/AccountContext';
// import { useMailUI } from '@context/MailUIContext';
// import { useMailData } from '@context/index';
// import { useScreen } from '@context/ScreenContext';
// import deleteIconHover from "@images/trash-icon-hover.svg";
// import deleteIcon from "@images/trash-icon.svg";
// import historyIcon from "@images/history-icon.svg";
// import historyIconHover from "@images/history-icon-hover.svg"
// import folderIcon from "@images/plus-icon.svg";
// import folderIconHover from "@images/plus-icon-hover.svg";
// import InteractiveIcon from '../InteractiveIcon';
// import {
//     useAiChat,
//     type AiChatAssistantMessage,
//     type AiChatMessage,
// } from '@hooks/useAiChat';
// import type { AiChatCitation, AiChatConversationSummary } from '@services/aiService/aiChatService';
// import { AiChatMarkdown } from '@utils/aiChatMarkdown';
// import {
//     AI_SOURCES_BOX_TITLE,
//     buildAiSourcesPagination,
//     mapAiCitationsToEmails,
// } from '@utils/aiChatCitationUtil';

// /* ─── Status copy helpers ─────────────────────────────────── */
// function getStatusCopy(msg: AiChatAssistantMessage): string | null {
//     switch (msg.status) {
//         case 'not_found':
//             return "I couldn't find any emails that match your question.";
//         case 'needs_clarification':
//             return msg.clarifyingQuestion ?? 'Could you give me a bit more detail?';
//         case 'refused':
//             return "I can only help with read-only questions about your mailbox.";
//         default:
//             return null;
//     }
// }

// interface MessageItemProps {
//     msg: AiChatMessage;
//     isLast: boolean;
//     thumbs: 'up' | 'down' | null;
//     onThumbsClick: (value: 'up' | 'down') => void;
//     onShowSources: (citations: AiChatCitation[]) => void;
// }

// function MessageItem({
//     msg,
//     isLast: _isLast,
//     thumbs: _thumbs,
//     onThumbsClick: _onThumbsClick,
//     onShowSources,
// }: MessageItemProps) {
//     if (msg.role === 'user') {
//         return (
//             <div className="ai-chat-message ai-chat-message--user">
//                 <span className="ai-chat-message__label">You</span>
//                 <div className="ai-chat-message__bubble">{msg.text}</div>
//             </div>
//         );
//     }

//     const statusCopy = getStatusCopy(msg);
//     const sourceCount = msg.citations?.length ?? 0;

//     return (
//         <div className="ai-chat-message ai-chat-message--assistant">
//             <span className="ai-chat-message__label">Mailspot assistant</span>

//             {/* Answer text or status message */}
//             {msg.answer ? (
//                 <div className="ai-chat-message__bubble ai-chat-message__bubble--md">
//                     <AiChatMarkdown text={msg.answer} />
//                 </div>
//             ) : statusCopy ? (
//                 <div className="ai-chat-status">{statusCopy}</div>
//             ) : null}

//             {sourceCount > 0 && (
//                 <button
//                     type="button"
//                     className="btn-new ai-chat-show-sources-btn"
//                     onClick={() => onShowSources(msg.citations)}
//                     title="List source emails in the mail panel"
//                 >
//                     Show sources ({sourceCount})
//                 </button>
//             )}
//         </div>
//     );
// }

// interface HistoryDropdownProps {
//     conversations: AiChatConversationSummary[];
//     activeConversationId: string | null;
//     isLoadingHistory: boolean;
//     isLoadingMoreHistory: boolean;
//     hasMore: boolean;
//     position: { top: number; left: number };
//     onSelect: (conversationId: string) => void;
//     onDelete: (conversationId: string) => void;
//     onLoadMore: () => void;
// }

// function HistoryDropdown({
//     conversations,
//     activeConversationId,
//     isLoadingHistory,
//     isLoadingMoreHistory,
//     hasMore,
//     position,
//     onSelect,
//     onDelete,
//     onLoadMore,
// }: HistoryDropdownProps) {
//     return (
//         <div
//             className="ai-chat-history-dropdown"
//             role="menu"
//             aria-label="Previous chats"
//             style={{ top: position.top, left: position.left }}
//         >
//             <div className="ai-chat-history-dropdown__header">Previous</div>

//             <div className="ai-chat-history-dropdown__list">
//                 {isLoadingHistory && conversations.length === 0 ? (
//                     <div className="ai-chat-history-dropdown__empty" role="status">
//                         <span
//                             className="spinner-border spinner-border-sm text-primary"
//                             role="status"
//                         />
//                         <span>Loading…</span>
//                     </div>
//                 ) : conversations.length === 0 ? (
//                     <div className="ai-chat-history-dropdown__empty">No past chats</div>
//                 ) : (
//                     conversations.map((item) => {
//                         const isActive = item.conversationId === activeConversationId;
//                         const title = item.title?.trim() || 'Untitled chat';
//                         return (
//                             <div
//                                 key={item.conversationId}
//                                 className={`ai-chat-history-dropdown__item${isActive ? ' is-active' : ''}`}
//                                 role="none"
//                             >
//                                 <button
//                                     type="button"
//                                     className="ai-chat-history-dropdown__item-btn"
//                                     role="menuitem"
//                                     onClick={() => onSelect(item.conversationId)}
//                                     title={title}
//                                 >
//                                     <span className="ai-chat-history-dropdown__item-title">
//                                         {title}
//                                     </span>
//                                 </button>
//                                 <button
//                                     type="button"
//                                     className="ai-chat-history-dropdown__delete-btn hover-link icon-hover-effect"
//                                     onClick={(event) => {
//                                         event.preventDefault();
//                                         event.stopPropagation();
//                                         void onDelete(item.conversationId);
//                                     }}
//                                     aria-label={`Delete chat: ${title}`}
//                                 >
//                                     <InteractiveIcon
//                                         defaultIcon={deleteIcon}
//                                         hoverIcon={deleteIconHover}
//                                         activeIcon=""
//                                         isActive={false}
//                                         alt=""
//                                         className="interactive-icon hover-image"
//                                         renderAs="img"
//                                         tooltip="Delete chat"
//                                     />
//                                 </button>
//                             </div>
//                         );
//                     })
//                 )}

//                 {hasMore && (
//                     <button
//                         type="button"
//                         className="btn-new ai-chat-history-dropdown__load-more"
//                         onClick={() => void onLoadMore()}
//                         disabled={isLoadingMoreHistory}
//                     >
//                         {isLoadingMoreHistory ? 'Loading…' : 'Load more'}
//                     </button>
//                 )}
//             </div>
//         </div>
//     );
// }

// /* ─── Main panel component ────────────────────────────────── */
// export default function AiChatPanel() {
//     const { isAiChatOpen, setIsAiChatOpen } = useMailUI();
//     const { activeAccountId } = useAccount();
//     const {
//         userPermissions,
//         setEmailDetailSelected,
//         setActiveEmailMessageId,
//         setEmails,
//         setPagination,
//         setTotalEmailBadge,
//         setBoxTitle,
//         setAllSearchResult,
//         boxName,
//         boxTitle,
//     } = useMailData();

//     const openFolderLabel = (boxTitle || boxName || 'this folder').trim();
//     const { setIsMailListOpen, setToolbarState } = useMailUI();
//     const { isMobilebig, isDesktop } = useScreen();

//     const {
//         messages,
//         isLoading,
//         thumbs,
//         sendMessage,
//         resetChat,
//         sendThumbsFeedback,
//         conversations,
//         nextCursor,
//         isLoadingHistory,
//         isLoadingMoreHistory,
//         isOpeningConversation,
//         composerDisabled,
//         activeConversationId,
//         loadConversations,
//         loadMoreConversations,
//         openConversation,
//         deleteConversation,
//     } = useAiChat({ currentBoxName: boxName });

//     const [inputText, setInputText] = useState('');
//     const [isHistoryOpen, setIsHistoryOpen] = useState(false);
//     const [historyDropdownPos, setHistoryDropdownPos] = useState<{ top: number; left: number } | null>(null);
//     const bodyRef = useRef<HTMLDivElement>(null);
//     const textareaRef = useRef<HTMLTextAreaElement>(null);
//     const historyToggleRef = useRef<HTMLDivElement>(null);

//     /* Push AI source citations into the main mail list (like search results) — only on button click. */
//     const showCitationsInMailList = useCallback(
//         (citations: AiChatCitation[]) => {
//             if (!citations.length) return;

//             const listEmails = mapAiCitationsToEmails(citations);
//             setAllSearchResult(true);
//             setEmails(listEmails);
//             setPagination(buildAiSourcesPagination(listEmails.length));
//             setTotalEmailBadge(listEmails.length);
//             setBoxTitle(AI_SOURCES_BOX_TITLE);
//             setEmailDetailSelected(null);
//             setActiveEmailMessageId(null);
//             setToolbarState({
//                 showBack: false,
//                 showSelectAll: true,
//                 showRefresh: true,
//                 showDelete: false,
//                 showMarkAsRead: false,
//                 showMarkAsUnread: false,
//                 showMove: false,
//             });

//             if (!isDesktop) {
//                 setIsMailListOpen(true);
//             }
//         },
//         [
//             isDesktop,
//             setActiveEmailMessageId,
//             setAllSearchResult,
//             setBoxTitle,
//             setEmailDetailSelected,
//             setEmails,
//             setIsMailListOpen,
//             setPagination,
//             setToolbarState,
//             setTotalEmailBadge,
//         ],
//     );

//     /* Account switch: clear local composer UI and close the panel (hook clears transcript/history). */
//     useEffect(() => {
//         setInputText('');
//         setIsHistoryOpen(false);
//         if (textareaRef.current) {
//             textareaRef.current.style.height = 'auto';
//             textareaRef.current.classList.remove('is-scrollable');
//         }
//         setIsAiChatOpen(false);
//     }, [activeAccountId, setIsAiChatOpen]);

//     /* Load first history page whenever the panel opens; keep history closed until the user opens it. */
//     useEffect(() => {
//         if (!isAiChatOpen) {
//             setIsHistoryOpen(false);
//             return;
//         }
//         setIsHistoryOpen(false);
//         void loadConversations();
//     }, [isAiChatOpen, loadConversations]);

//     /* Auto-scroll to bottom on new messages */
//     useEffect(() => {
//         if (bodyRef.current) {
//             bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
//         }
//     }, [messages, isLoading, isOpeningConversation]);

//     /* Focus textarea when panel opens */
//     useEffect(() => {
//         if (isAiChatOpen && !composerDisabled) {
//             setTimeout(() => textareaRef.current?.focus(), 100);
//         }
//     }, [isAiChatOpen, composerDisabled]);

//     /* Position history dropdown under the toggle (portaled; panel overflow clips otherwise). */
//     useLayoutEffect(() => {
//         if (!isHistoryOpen) {
//             setHistoryDropdownPos(null);
//             return;
//         }

//         const updatePosition = () => {
//             const anchor = historyToggleRef.current;
//             if (!anchor) return;
//             const rect = anchor.getBoundingClientRect();
//             const dropdownWidth = Math.min(280, window.innerWidth - 24);
//             let left = rect.left;
//             left = Math.min(left, window.innerWidth - dropdownWidth - 8);
//             left = Math.max(8, left);
//             setHistoryDropdownPos({
//                 top: rect.bottom + 8,
//                 left,
//             });
//         };

//         updatePosition();
//         window.addEventListener('resize', updatePosition);
//         window.addEventListener('scroll', updatePosition, true);
//         return () => {
//             window.removeEventListener('resize', updatePosition);
//             window.removeEventListener('scroll', updatePosition, true);
//         };
//     }, [isHistoryOpen]);

//     /* Close history dropdown on outside click / Escape */
//     useEffect(() => {
//         if (!isHistoryOpen) return;

//         const onPointerDown = (event: MouseEvent | TouchEvent) => {
//             const target = event.target as Node;
//             if (historyToggleRef.current?.contains(target)) return;
//             if (target instanceof Element && target.closest('.ai-chat-history-dropdown')) return;
//             setIsHistoryOpen(false);
//         };

//         const onKeyDown = (event: globalThis.KeyboardEvent) => {
//             if (event.key === 'Escape') setIsHistoryOpen(false);
//         };

//         const bindTimer = window.setTimeout(() => {
//             document.addEventListener('mousedown', onPointerDown);
//             document.addEventListener('touchstart', onPointerDown);
//             document.addEventListener('keydown', onKeyDown);
//         }, 0);

//         return () => {
//             window.clearTimeout(bindTimer);
//             document.removeEventListener('mousedown', onPointerDown);
//             document.removeEventListener('touchstart', onPointerDown);
//             document.removeEventListener('keydown', onKeyDown);
//         };
//     }, [isHistoryOpen]);

//     /* Grow textarea with content */
//     const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//         setInputText(e.target.value);
//         const el = e.target;
//         el.style.height = 'auto';
//         const needsScroll = el.scrollHeight > 120;
//         el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
//         // Only allow a scrollbar once the field hits max height (avoids the black line)
//         el.classList.toggle('is-scrollable', needsScroll);
//     };

//     const handleSend = useCallback(async () => {
//         const text = inputText.trim();
//         if (!text || composerDisabled) return;
//         setInputText('');

//         if (textareaRef.current) {
//             textareaRef.current.style.height = 'auto';
//             textareaRef.current.classList.remove('is-scrollable');
//         }

//         await sendMessage(text);
//         setIsHistoryOpen(false);
//     }, [composerDisabled, inputText, sendMessage]);

//     const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             void handleSend();
//         }
//     };

//     const handleNewChat = () => {
//         resetChat();
//         setInputText('');
//         if (textareaRef.current) {
//             textareaRef.current.style.height = 'auto';
//             textareaRef.current.focus();
//         }
//         setIsHistoryOpen(false);
//     };

//     const handleClose = () => {
//         setIsAiChatOpen(false);
//     };

//     const handleSelectConversation = async (conversationId: string) => {
//         await openConversation(conversationId);
//         setInputText('');
//         if (textareaRef.current) {
//             textareaRef.current.style.height = 'auto';
//         }
//         setIsHistoryOpen(false);
//     };

//     /* Don't render the panel at all if feature is disabled */
//     if (!userPermissions?.aiFeatures) return null;

//     /* Determine which assistant messages are "last" for thumbs display */
//     const lastAssistantIndex = messages.reduceRight(
//         (acc, m, i) => (acc === -1 && m.role === 'assistant' ? i : acc),
//         -1,
//     );

//     return (
//         <>
//             {/* Mobile backdrop (full-screen panel ≤767px) */}
//             {isMobilebig && isAiChatOpen && (
//                 <div className="ai-chat-backdrop" onClick={handleClose} aria-hidden="true" />
//             )}

//             {isHistoryOpen &&
//                 historyDropdownPos &&
//                 typeof document !== 'undefined' &&
//                 createPortal(
//                     <HistoryDropdown
//                         conversations={conversations}
//                         activeConversationId={activeConversationId}
//                         isLoadingHistory={isLoadingHistory}
//                         isLoadingMoreHistory={isLoadingMoreHistory}
//                         hasMore={Boolean(nextCursor)}
//                         position={historyDropdownPos}
//                         onSelect={(id) => void handleSelectConversation(id)}
//                         onDelete={(id) => void deleteConversation(id)}
//                         onLoadMore={loadMoreConversations}
//                     />,
//                     document.body,
//                 )}

//             <aside
//                 className={`ai-chat-panel${isAiChatOpen ? ' is-open' : ''}`}
//                 role="complementary"
//                 aria-label="Find in mail — AI chat"
//                 aria-hidden={!isAiChatOpen}
//             >
//                 {/* ── Header ── */}
//                 <div className="ai-chat-panel__header">
//                     <div className="ai-chat-panel__title-wrap">
//                         <h2 className="ai-chat-panel__title">Find in mail</h2>
//                         <span className="ai-chat-panel__shortcut" title="Keyboard shortcut">
//                             Ctrl+D
//                         </span>
//                     </div>
//                     <div className="ai-chat-panel__header-actions">
//                         <button
//                             type="button"
//                             className="ai-chat-panel__new-btn hover-link  icon-hover-effect"
//                             onClick={handleNewChat}
//                             title="Start a new conversation"
//                         >
//                             <InteractiveIcon
//                                 defaultIcon={folderIcon}
//                                 hoverIcon={folderIconHover}
//                                 activeIcon=""
//                                 isActive={false}
//                                 alt=""
//                                 className="interactive-icon hover-image"
//                                 renderAs="img"
//                                 tooltip="New chat"
//                             />
//                         </button>
//                         <div className="ai-chat-panel__history-wrap" ref={historyToggleRef}>
//                             <button
//                                 type="button"
//                                 className={`ai-chat-panel__history-toggle hover-link  icon-hover-effect ${isHistoryOpen ? ' is-active' : ''}`}
//                                 onClick={() => setIsHistoryOpen((open) => !open)}
//                                 aria-pressed={isHistoryOpen}
//                                 aria-expanded={isHistoryOpen}
//                                 aria-haspopup="menu"
//                                 aria-label={isHistoryOpen ? 'Hide chat history' : 'Show chat history'}
//                             >
//                                 <InteractiveIcon
//                                     defaultIcon={historyIcon}
//                                     hoverIcon={historyIconHover}
//                                     activeIcon=""
//                                     isActive={false}
//                                     alt=""
//                                     className="interactive-icon hover-image"
//                                     renderAs="img"
//                                     tooltip="Chat history"
//                                 />
//                             </button>
//                         </div>

//                         <button
//                             type="button"
//                             className="ai-chat-panel__close-btn"
//                             onClick={handleClose}
//                             aria-label="Close AI chat panel"
//                         >
//                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//                                 <line x1="18" y1="6" x2="6" y2="18" />
//                                 <line x1="6" y1="6" x2="18" y2="18" />
//                             </svg>
//                         </button>
//                     </div>
//                 </div>

//                 <div className="ai-chat-panel__content">
//                     <div className="ai-chat-panel__chat">
//                         {/* ── Body ── */}
//                         <div className="ai-chat-panel__body" ref={bodyRef}>
//                             {isOpeningConversation ? (
//                                 <div className="ai-chat-loading" aria-live="polite" aria-busy="true">
//                                     <span
//                                         className="spinner-border spinner-border-sm text-primary"
//                                         role="status"
//                                     />
//                                     <span>Opening chat…</span>
//                                 </div>
//                             ) : messages.length === 0 && !isLoading ? (
//                                 <div className="ai-chat-empty">
//                                     <svg className="ai-chat-empty__icon" viewBox="0 0 24 24" fill="none" stroke="#717d84" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
//                                         <circle cx="11" cy="11" r="8" />
//                                         <line x1="21" y1="21" x2="16.65" y2="16.65" />
//                                         <path d="M11 8v3l2 2" />
//                                     </svg>
//                                     <p className="ai-chat-empty__title">Ask about your mail</p>
//                                     <p className="ai-chat-empty__hint">
//                                         Answers are limited to emails in your currently open folder
//                                         {' '}(<strong>{openFolderLabel}</strong>).
//                                     </p>
//                                 </div>
//                             ) : (
//                                 <>
//                                     {messages.map((msg, i) => (
//                                         <MessageItem
//                                             key={i}
//                                             msg={msg}
//                                             isLast={i === lastAssistantIndex}
//                                             thumbs={i === lastAssistantIndex ? thumbs : null}
//                                             onThumbsClick={sendThumbsFeedback}
//                                             onShowSources={showCitationsInMailList}
//                                         />
//                                     ))}

//                                     {isLoading && (
//                                         <div className="ai-chat-loading" aria-live="polite" aria-busy="true">
//                                             <span
//                                                 className="spinner-border spinner-border-sm text-primary"
//                                                 role="status"
//                                             />
//                                             <span>Searching your mailbox…</span>
//                                         </div>
//                                     )}
//                                 </>
//                             )}
//                         </div>

//                         {/* ── Footer ── */}
//                         <div className="ai-chat-panel__footer">
//                             <p className="ai-chat-disclaimer">
//                                 Answers come from retrieved mailbox emails. Open the source to verify.
//                             </p>
//                             <div className="ai-chat-input-row">
//                                 <div className="ai-chat-input-wrap">
//                                     <textarea
//                                         ref={textareaRef}
//                                         className="form-control ai-chat-panel__textarea"
//                                         placeholder="Ask about your emails…"
//                                         value={inputText}
//                                         rows={1}
//                                         onChange={handleTextareaChange}
//                                         onKeyDown={handleKeyDown}
//                                         disabled={composerDisabled}
//                                         aria-label="Message input"
//                                     />
//                                 </div>
//                                 <button
//                                     type="button"
//                                     className={`btn-new ai-chat-panel__send-btn${inputText.trim() ? ' has-prompt' : ''}`}
//                                     onClick={() => void handleSend()}
//                                     disabled={composerDisabled || !inputText.trim()}
//                                     aria-label="Send message"
//                                 >
//                                     <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
//                                         <path d="M3 4L19 11L3 18L4.99889 11H10.4989H4.99997L3 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//                                     </svg>
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </aside>
//         </>
//     );
// }



import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from '@context/AccountContext';
import { useMailUI } from '@context/MailUIContext';
import { useMailData } from '@context/index';
import { useScreen } from '@context/ScreenContext';
import deleteIconHover from "@images/trash-icon-hover.svg";
import deleteIcon from "@images/trash-icon.svg";
import historyIcon from "@images/history-icon.svg";
import historyIconHover from "@images/history-icon-hover.svg"
import folderIcon from "@images/plus-icon.svg";
import folderIconHover from "@images/plus-icon-hover.svg";
import closeIconHover from "@assets/images/close-icon-hover.svg";
import closeIcon from "@assets/images/close-icon.svg";
import InteractiveIcon from '../InteractiveIcon';
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

/* ─── Design switches ─────────────────────────────────────── */
/** Show the email cards (filters, "Show N more emails") inside the assistant bubble. */
const SHOW_SOURCE_CARDS = false;
/** How many cards are visible before the "Show N more emails" button. */
const CARDS_COLLAPSED_COUNT = 3;

/* Markdown is memoised so unrelated re-renders (typing in the composer, etc.)
   never rebuild the DOM while the typewriter is working on it. */
const MemoMarkdown = memo(AiChatMarkdown);

/*
 * When the email cards are shown, every email is already listed one by one
 * inside the box, so the backend's headings / numbered items / bullets would
 * only repeat them. Keep just the intro sentence(s) above the first heading
 * or list item.
 */
function stripEmailList(answer: string, count: number): string {
    const intro: string[] = [];
    for (const line of answer.split('\n')) {
        if (/^\s*(#{1,6}\s|\d+[.)]\s|[-*•]\s)/.test(line)) break;
        // A line that is only a bold title ("**Webinars & Updates**") starts a section.
        if (/^\s*\*\*[^*]+\*\*:?\s*$/.test(line)) break;
        intro.push(line);
    }

    const text = intro.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text) return text;
    return count === 1
        ? 'Here is the matching email.'
        : `Here are the ${count} matching emails.`;
}

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

/* ─── Typewriter (letter by letter) ───────────────────────── */
/*
 * Works on the DOM that React already rendered, so markdown (lists, bold,
 * italics, code) keeps its real layout. Text nodes are emptied and then
 * revealed a few characters per frame; blocks stay hidden until their first
 * letter is typed. Click on the text to skip the animation.
 */
function useTypewriter(
    ref: RefObject<HTMLElement | null>,
    enabled: boolean,
    onTick: () => void,
    onDone: () => void,
) {
    const onTickRef = useRef(onTick);
    const onDoneRef = useRef(onDone);
    onTickRef.current = onTick;
    onDoneRef.current = onDone;

    useLayoutEffect(() => {
        const root = ref.current;
        if (!enabled || !root) return;

        const reduceMotion =
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            onDoneRef.current();
            return;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        let current: Node | null = walker.nextNode();
        while (current) {
            const textNode = current as Text;
            if (textNode.data.trim().length > 0) nodes.push(textNode);
            current = walker.nextNode();
        }

        const full = nodes.map((node) => node.data);
        const total = full.reduce((sum, text) => sum + text.length, 0);
        if (!total) {
            onDoneRef.current();
            return;
        }

        const ancestors = nodes.map((node) => {
            const list: HTMLElement[] = [];
            let parent = node.parentElement;
            while (parent && parent !== root) {
                list.push(parent);
                parent = parent.parentElement;
            }
            return list;
        });

        ancestors.forEach((list) => list.forEach((el) => { el.style.display = 'none'; }));
        nodes.forEach((node) => { node.data = ''; });

        const caret = document.createElement('span');
        caret.className = 'ai-chat-caret';
        caret.setAttribute('aria-hidden', 'true');

        const duration = Math.min(6000, Math.max(1400, total * 12));
        const step = Math.max(1, Math.ceil(total / (duration / 16)));
        let nodeIndex = 0;
        let charIndex = 0;
        let finished = false;
        let timer = 0;

        const finish = (notify: boolean) => {
            if (finished) return;
            finished = true;
            window.clearInterval(timer);
            nodes.forEach((node, i) => { node.data = full[i]; });
            ancestors.forEach((list) => list.forEach((el) => { el.style.display = ''; }));
            caret.remove();
            root.removeEventListener('click', skip);
            if (notify) onDoneRef.current();
        };
        const skip = () => finish(true);

        const tick = () => {
            let left = step;
            while (left > 0 && nodeIndex < nodes.length) {
                const text = full[nodeIndex];
                if (charIndex === 0) {
                    ancestors[nodeIndex].forEach((el) => { el.style.display = ''; });
                }
                const take = Math.min(left, text.length - charIndex);
                charIndex += take;
                left -= take;
                nodes[nodeIndex].data = text.slice(0, charIndex);
                if (charIndex >= text.length) {
                    nodeIndex += 1;
                    charIndex = 0;
                }
            }
            const anchorIndex =
                charIndex === 0 && nodeIndex > 0 ? nodeIndex - 1 : Math.min(nodeIndex, nodes.length - 1);
            const anchor = nodes[anchorIndex];
            anchor.parentNode?.insertBefore(caret, anchor.nextSibling);
            onTickRef.current();
            if (nodeIndex >= nodes.length) finish(true);
        };

        root.addEventListener('click', skip);
        timer = window.setInterval(tick, 16);
        return () => finish(false);
    }, [enabled, ref]);
}

/* ─── Source cards (design: filters + mail cards) ─────────── */
type CardTone = 'g' | 'a' | 'p' | 'b';

interface CitationView {
    key: string;
    citation: AiChatCitation;
    sender: string;
    fromFull: string;
    initials: string;
    subject: string;
    snippet: string;
    dateText: string;
    label: string;
    tone: CardTone;
}

const TONES: CardTone[] = ['g', 'b', 'p', 'a'];
const LABEL_TONE_HINTS: Array<[RegExp, CardTone]> = [
    [/invit|event|meeting/i, 'g'],
    [/log|error|alert|attach/i, 'a'],
    [/calendar|schedul/i, 'p'],
    [/design|update|promo/i, 'b'],
];

function pickString(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
}

function pickLabel(source: Record<string, unknown>): string {
    const single = pickString(source, ['label', 'aiLabel', 'ai_label', 'category']);
    if (single) return single;
    const list = source.labels ?? source.aiLabels ?? source.ai_labels;
    if (Array.isArray(list) && list.length > 0) {
        const first: unknown = list[0];
        if (typeof first === 'string') return first.trim();
        if (first && typeof first === 'object') {
            return pickString(first as Record<string, unknown>, ['name', 'label', 'title']);
        }
    }
    return '';
}

function senderName(raw: string): string {
    // "Prit Dedaniya <prit.d@x.com>" -> "Prit Dedaniya", "raj.v@mail.x.com" -> "raj.v"
    const match = raw.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
    if (match && match[1].trim()) return match[1].trim();
    const address = match ? match[2] : raw;
    const at = address.indexOf('@');
    return at > 0 ? address.slice(0, at) : address;
}

function getInitials(name: string): string {
    const parts = name.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0];
    return letters.toUpperCase();
}

function hashTone(seed: string): CardTone {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return TONES[hash % TONES.length];
}

function toneFor(label: string, sender: string): CardTone {
    if (label) {
        const hint = LABEL_TONE_HINTS.find(([pattern]) => pattern.test(label));
        if (hint) return hint[1];
        return hashTone(label);
    }
    return hashTone(sender);
}

function formatCardDate(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    const date = value instanceof Date ? value : new Date(value as string | number);
    if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '';
    const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${day} · ${time}`;
}

/*
 * Single place that reads the citation fields. If your AiChatCitation uses
 * different property names, add them to the key lists below.
 */
function toCitationView(citation: AiChatCitation, index: number): CitationView {
    const source = citation as unknown as Record<string, unknown>;
    const fromFull = pickString(source, [
        'from', 'fromName', 'from_name', 'sender', 'senderName', 'fromEmail', 'from_email',
    ]);
    const sender = senderName(fromFull) || 'Unknown sender';
    const label = pickLabel(source);
    const id = pickString(source, ['messageId', 'message_id', 'id', 'uid']);
    return {
        key: id ? `${id}-${index}` : String(index),
        citation,
        sender,
        fromFull: fromFull || sender,
        initials: getInitials(sender),
        subject: pickString(source, ['subject', 'title']) || '(no subject)',
        snippet: pickString(source, ['snippet', 'preview', 'excerpt', 'bodyPreview', 'summary', 'text']),
        dateText: formatCardDate(
            source.date ?? source.receivedAt ?? source.received_at ?? source.sentAt ?? source.timestamp ?? source.createdAt,
        ),
        label,
        tone: toneFor(label, sender),
    };
}

interface SourceCardsProps {
    citations: AiChatCitation[];
    onOpenInMailList: (citations: AiChatCitation[]) => void;
}

function SourceCards({ citations, onOpenInMailList }: SourceCardsProps) {
    const items = useMemo(() => citations.map(toCitationView), [citations]);
    const [filter, setFilter] = useState('All');
    const [expanded, setExpanded] = useState(false);
    const [openKey, setOpenKey] = useState<string | null>(null);

    const labelCounts = useMemo(() => {
        const counts = new Map<string, number>();
        items.forEach((item) => {
            if (item.label) counts.set(item.label, (counts.get(item.label) ?? 0) + 1);
        });
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [items]);

    const visible = filter === 'All' ? items : items.filter((item) => item.label === filter);
    const shown = expanded ? visible : visible.slice(0, CARDS_COLLAPSED_COUNT);
    const hiddenCount = visible.length - shown.length;

    return (
        <div className="ai-chat-sources">
            {labelCounts.length > 1 && (
                <div className="ai-chat-filters" role="group" aria-label="Filter emails by label">
                    {[['All', items.length] as [string, number], ...labelCounts].map(([name, count]) => (
                        <button
                            key={name}
                            type="button"
                            className={`ai-chat-filter${filter === name ? ' is-active' : ''}`}
                            aria-pressed={filter === name}
                            onClick={() => {
                                setFilter(name);
                                setExpanded(false);
                            }}
                        >
                            {name}
                            <em>{count}</em>
                        </button>
                    ))}
                </div>
            )}

            <ul className="ai-chat-mail-cards">
                {shown.map((item, i) => {
                    const isOpen = openKey === item.key;
                    return (
                        <li
                            key={item.key}
                            className={`ai-chat-mail-card tone-${item.tone}${isOpen ? ' is-open' : ''}`}
                            style={{ '--i': i } as CSSProperties}
                        >
                            <button
                                type="button"
                                className="ai-chat-mail-card__main"
                                aria-expanded={isOpen}
                                onClick={() => setOpenKey(isOpen ? null : item.key)}
                            >
                                <span className="ai-chat-mail-card__avatar" aria-hidden="true">
                                    {item.initials}
                                </span>
                                <span className="ai-chat-mail-card__body">
                                    <span className="ai-chat-mail-card__meta">
                                        <span className="ai-chat-mail-card__from">{item.sender}</span>
                                        {item.label && (
                                            <span className="ai-chat-mail-card__pill">{item.label}</span>
                                        )}
                                        {item.dateText && (
                                            <span className="ai-chat-mail-card__date">{item.dateText}</span>
                                        )}
                                    </span>
                                    <span className="ai-chat-mail-card__subject">{item.subject}</span>
                                    {item.snippet && (
                                        <span className="ai-chat-mail-card__snippet">{item.snippet}</span>
                                    )}
                                </span>
                            </button>

                            {isOpen && (
                                <div className="ai-chat-mail-card__detail">
                                    <dl className="ai-chat-mail-card__facts">
                                        <dt>From</dt>
                                        <dd>{item.fromFull}</dd>
                                        {item.label && (
                                            <>
                                                <dt>Label</dt>
                                                <dd>{item.label}</dd>
                                            </>
                                        )}
                                        {item.dateText && (
                                            <>
                                                <dt>Received</dt>
                                                <dd>{item.dateText}</dd>
                                            </>
                                        )}
                                    </dl>
                                    <button
                                        type="button"
                                        className="ai-chat-mail-card__open"
                                        onClick={() => onOpenInMailList([item.citation])}
                                        title="List this email in the mail panel"
                                    >
                                        Open in mail list
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {(hiddenCount > 0 || (expanded && visible.length > CARDS_COLLAPSED_COUNT)) && (
                <button
                    type="button"
                    className="ai-chat-more-btn"
                    onClick={() => setExpanded((open) => !open)}
                >
                    {expanded ? 'Show fewer emails' : `Show ${hiddenCount} more emails`}
                </button>
            )}
        </div>
    );
}

/* ─── Assistant identity (header next to each answer) ─────── */
/** Shown when no person can be found in the question. */
const ASSISTANT_NAME = 'Mailspot assistant';

const NAME_STOPWORDS = new Set([
    'me', 'my', 'mine', 'the', 'a', 'an', 'this', 'that', 'last', 'next', 'week', 'month', 'today',
    'yesterday', 'all', 'any', 'emails', 'email', 'mail', 'mails', 'inbox', 'folder', 'summary',
    'you', 'us', 'them', 'him', 'her', 'it', 'and', 'or', 'in', 'on', 'for', 'is', 'are', 'what',
    'which', 'who', 'show', 'find', 'get', 'give', 'tell', 'ni', 'na', 'ki', 'ka', 'ke', 'ko',
]);

/*
 * Pull the searched person out of the user's question:
 * "summary of mails regarding Raj" -> "Raj", "raj ki mail batao" -> "Raj".
 */
function extractPersonName(question: string): string {
    const clean = (raw: string | undefined): string => {
        if (!raw) return '';
        const words = raw
            .replace(/[?.,!:;"']+$/g, '')
            .split(/\s+/)
            .filter((w) => w && !NAME_STOPWORDS.has(w.toLowerCase()));
        if (!words.length) return '';
        const kept = words.slice(0, 2).filter((w) => /^[\p{L}][\p{L}.'-]*$/u.test(w));
        return kept.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
    };

    const text = question.trim();
    const patterns: RegExp[] = [
        /\b(?:regarding|about|from|by|of|with|related to|sent by)\s+(?:mr\.?|ms\.?|mrs\.?)?\s*([\p{L}][\p{L}.'-]*(?:\s+[\p{L}][\p{L}.'-]*)?)/iu,
        /([\p{L}][\p{L}.'-]*)\s+(?:ki|ka|ke|na|ni)\s+(?:mail|mails|email|emails)/iu,
        /([\p{L}][\p{L}.'-]*)['’]s\s+(?:mail|mails|email|emails)/iu,
    ];
    for (const pattern of patterns) {
        const name = clean(text.match(pattern)?.[1]);
        if (name) return name;
    }
    return ASSISTANT_NAME;
}

function SparkleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.6667 3.74999L16.25 1.66666L15.8333 3.74999L16.25 5.83332L16.6667 3.74999Z" stroke-width="1.25" stroke-linejoin="round" stroke="#717D84" />
            <path d="M18.3333 3.75001L16.25 3.33334L14.1667 3.75001L16.25 4.16668L18.3333 3.75001Z" stroke-width="1.25" stroke-linejoin="round" stroke="#717D84" />
            <path d="M2.70833 16.7361V17.8473M3.54167 17.2917C3.54167 17.7519 3.16857 18.125 2.70833 18.125C2.2481 18.125 1.875 17.7519 1.875 17.2917C1.875 16.8314 2.2481 16.4583 2.70833 16.4583C3.16857 16.4583 3.54167 16.8314 3.54167 17.2917Z" stroke-width="1.25" stroke-linecap="round" stroke="#717D84" />
            <path d="M10.7 6.36678L10.1874 4.14534C10.0777 3.67004 9.65452 3.33334 9.16669 3.33334C8.67885 3.33334 8.25565 3.67004 8.14597 4.14534L7.63333 6.36678C7.44124 7.19919 7.34519 7.6154 7.13963 7.9563C6.92965 8.30454 6.63789 8.59634 6.28965 8.80626C5.94875 9.01184 5.53254 9.10793 4.70012 9.30001L2.47868 9.81259C2.00338 9.92234 1.66669 10.3455 1.66669 10.8333C1.66669 11.3212 2.00338 11.7443 2.47868 11.8541L4.70012 12.3667C5.53254 12.5588 5.94875 12.6548 6.28965 12.8604C6.63789 13.0703 6.92965 13.3622 7.13963 13.7103C7.34519 14.0513 7.44124 14.4675 7.63333 15.2999L8.14597 17.5213C8.25565 17.9967 8.67885 18.3333 9.16669 18.3333C9.65452 18.3333 10.0777 17.9967 10.1874 17.5213L10.7 15.2999C10.8921 14.4675 10.9882 14.0513 11.1938 13.7103C11.4037 13.3622 11.6955 13.0703 12.0437 12.8604C12.3846 12.6548 12.8009 12.5588 13.6333 12.3667L15.8547 11.8541C16.33 11.7443 16.6667 11.3212 16.6667 10.8333C16.6667 10.3455 16.33 9.92234 15.8547 9.81259L13.6333 9.30001C12.8009 9.10793 12.3846 9.01184 12.0437 8.80626C11.6955 8.59634 11.4037 8.30454 11.1938 7.9563C10.9882 7.6154 10.8921 7.19919 10.7 6.36678Z" stroke-width="1.25" stroke="#717D84" />
        </svg>

    );
}

/* ─── Loader replacement: animated gradient border ────────── */
function SearchingCard({ text }: { text: string }) {
    return (
        <div
            className="ai-chat-loading ai-chat-loading--glow"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <span className="ai-chat-loading__text">{text}</span>
        </div>
    );
}

/* ─── Messages ────────────────────────────────────────────── */
interface MessageItemProps {
    msg: AiChatMessage;
    isLast: boolean;
    thumbs: 'up' | 'down' | null;
    onThumbsClick: (value: 'up' | 'down') => void;
    onShowSources: (citations: AiChatCitation[]) => void;
    /** True only for the answer that just arrived, so it types out. */
    animate: boolean;
    onTypingTick: () => void;
    /** The user question this answer belongs to (used for the header name). */
    question?: string;
}

function AssistantMessageItem({
    msg,
    title,
    animate,
    onTypingTick,
    onShowSources,
}: {
    msg: AiChatAssistantMessage;
    /** Header name: the person the user searched for (falls back to the assistant name). */
    title: string;
    animate: boolean;
    onTypingTick: () => void;
    onShowSources: (citations: AiChatCitation[]) => void;
}) {
    const statusCopy = getStatusCopy(msg);
    const citations = msg.citations ?? [];
    const sourceCount = citations.length;
    const [done, setDone] = useState(!animate);
    const [showThinking, setShowThinking] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    /* The toggle only appears when the backend sends reasoning text. */
    const thinkingText = pickString(
        msg as unknown as Record<string, unknown>,
        ['thinking', 'reasoning', 'thoughts'],
    );

    useEffect(() => {
        if (!animate) setDone(true);
    }, [animate]);

    const handleDone = useCallback(() => setDone(true), []);
    useTypewriter(textRef, animate && !done, onTypingTick, handleDone);

    const hasCards = SHOW_SOURCE_CARDS && sourceCount > 0;
    const answerText = useMemo(() => {
        if (!msg.answer) return '';
        return hasCards ? stripEmailList(msg.answer, sourceCount) : msg.answer;
    }, [msg.answer, hasCards, sourceCount]);

    return (
        <div className="ai-chat-message ai-chat-message--assistant">
            {/* Header: sparkle + assistant name, optional "Show thinking" toggle */}
            <div className="ai-chat-assistant-head">
                <span className="ai-chat-assistant-head__name">
                    <SparkleIcon />
                    Mailspot assistant
                </span>
                {thinkingText && (
                    <button
                        type="button"
                        className="ai-chat-thinking-toggle"
                        aria-expanded={showThinking}
                        onClick={() => setShowThinking((open) => !open)}
                    >
                        {showThinking ? 'Hide thinking' : 'Show thinking'}
                        <svg
                            className={`ai-chat-thinking-toggle__chevron${showThinking ? ' is-open' : ''}`}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                )}
            </div>

            {thinkingText && showThinking && (
                <div className="ai-chat-thinking">{thinkingText}</div>
            )}

            {/* Answer text or status message */}
            {msg.answer ? (
                <div
                    className={`ai-chat-message__bubble ai-chat-message__bubble--md${hasCards ? ' ai-chat-message__bubble--wide' : ''}`}
                >
                    <div ref={textRef} className="ai-chat-typewriter">
                        <MemoMarkdown text={answerText} />
                    </div>
                    {hasCards && done && (
                        <SourceCards citations={citations} onOpenInMailList={onShowSources} />
                    )}
                </div>
            ) : statusCopy ? (
                <div ref={textRef} className="ai-chat-status">{statusCopy}</div>
            ) : null}

            {sourceCount > 0 && done && (
                <button
                    type="button"
                    className="btn-new ai-chat-show-sources-btn"
                    onClick={() => onShowSources(citations)}
                    title="List source emails in the mail panel"
                >
                    Show sources ({sourceCount})
                </button>
            )}
        </div>
    );
}

function MessageItem({
    msg,
    isLast: _isLast,
    thumbs: _thumbs,
    onThumbsClick: _onThumbsClick,
    onShowSources,
    animate,
    onTypingTick,
    question,
}: MessageItemProps) {
    if (msg.role === 'user') {
        return (
            <div className="ai-chat-message ai-chat-message--user">
                <span className="ai-chat-message__label">You</span>
                <div className="ai-chat-message__bubble">{msg.text}</div>
            </div>
        );
    }

    return (
        <AssistantMessageItem
            msg={msg}
            title={question ? extractPersonName(question) : ASSISTANT_NAME}
            animate={animate}
            onTypingTick={onTypingTick}
            onShowSources={onShowSources}
        />
    );
}

interface HistoryDropdownProps {
    conversations: AiChatConversationSummary[];
    activeConversationId: string | null;
    isLoadingHistory: boolean;
    isLoadingMoreHistory: boolean;
    hasMore: boolean;
    position: { top: number; left: number };
    onSelect: (conversationId: string) => void;
    onDelete: (conversationId: string) => void;
    onLoadMore: () => void;
}

function HistoryDropdown({
    conversations,
    activeConversationId,
    isLoadingHistory,
    isLoadingMoreHistory,
    hasMore,
    position,
    onSelect,
    onDelete,
    onLoadMore,
}: HistoryDropdownProps) {
    return (
        <div
            className="ai-chat-history-dropdown"
            role="menu"
            aria-label="Previous chats"
            style={{ top: position.top, left: position.left }}
        >
            <div className="ai-chat-history-dropdown__header">Previous</div>

            <div className="ai-chat-history-dropdown__list">
                {isLoadingHistory && conversations.length === 0 ? (
                    <div className="ai-chat-history-dropdown__empty" role="status">
                        <span
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                        />
                        <span>Loading…</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="ai-chat-history-dropdown__empty">No past chats</div>
                ) : (
                    conversations.map((item) => {
                        const isActive = item.conversationId === activeConversationId;
                        const title = item.title?.trim() || 'Untitled chat';
                        return (
                            <div
                                key={item.conversationId}
                                className={`ai-chat-history-dropdown__item${isActive ? ' is-active' : ''}`}
                                role="none"
                            >
                                <button
                                    type="button"
                                    className="ai-chat-history-dropdown__item-btn"
                                    role="menuitem"
                                    onClick={() => onSelect(item.conversationId)}
                                    title={title}
                                >
                                    <span className="ai-chat-history-dropdown__item-title">
                                        {title}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="ai-chat-history-dropdown__delete-btn hover-link icon-hover-effect"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        void onDelete(item.conversationId);
                                    }}
                                    aria-label={`Delete chat: ${title}`}
                                >
                                    <InteractiveIcon
                                        defaultIcon={deleteIcon}
                                        hoverIcon={deleteIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Delete chat"
                                    />
                                </button>
                            </div>
                        );
                    })
                )}

                {hasMore && (
                    <button
                        type="button"
                        className="btn-new ai-chat-history-dropdown__load-more"
                        onClick={() => void onLoadMore()}
                        disabled={isLoadingMoreHistory}
                    >
                        {isLoadingMoreHistory ? 'Loading…' : 'Load more'}
                    </button>
                )}
            </div>
        </div>
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
    } = useMailData();

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
    const [historyDropdownPos, setHistoryDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const historyToggleRef = useRef<HTMLDivElement>(null);

    /* Typewriter bookkeeping: which message index just arrived and should type out. */
    const freshIndexRef = useRef(-1);
    const pendingAnswerRef = useRef(false);
    const sentLengthRef = useRef(0);

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

    /* Keep the newest text in view while the answer types out. */
    const handleTypingTick = useCallback(() => {
        const el = bodyRef.current;
        if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
            el.scrollTop = el.scrollHeight;
        }
    }, []);

    /* Account switch: clear local composer UI and close the panel (hook clears transcript/history). */
    useEffect(() => {
        setInputText('');
        setIsHistoryOpen(false);
        freshIndexRef.current = -1;
        pendingAnswerRef.current = false;
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.classList.remove('is-scrollable');
        }
        setIsAiChatOpen(false);
    }, [activeAccountId, setIsAiChatOpen]);

    /* Load first history page whenever the panel opens; keep history closed until the user opens it. */
    useEffect(() => {
        if (!isAiChatOpen) {
            setIsHistoryOpen(false);
            return;
        }
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

    /* Position history dropdown under the toggle (portaled; panel overflow clips otherwise). */
    useLayoutEffect(() => {
        if (!isHistoryOpen) {
            setHistoryDropdownPos(null);
            return;
        }

        const updatePosition = () => {
            const anchor = historyToggleRef.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            const dropdownWidth = Math.min(280, window.innerWidth - 24);
            let left = rect.left;
            left = Math.min(left, window.innerWidth - dropdownWidth - 8);
            left = Math.max(8, left);
            setHistoryDropdownPos({
                top: rect.bottom + 8,
                left,
            });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isHistoryOpen]);

    /* Close history dropdown on outside click / Escape */
    useEffect(() => {
        if (!isHistoryOpen) return;

        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (historyToggleRef.current?.contains(target)) return;
            if (target instanceof Element && target.closest('.ai-chat-history-dropdown')) return;
            setIsHistoryOpen(false);
        };

        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') setIsHistoryOpen(false);
        };

        const bindTimer = window.setTimeout(() => {
            document.addEventListener('mousedown', onPointerDown);
            document.addEventListener('touchstart', onPointerDown);
            document.addEventListener('keydown', onKeyDown);
        }, 0);

        return () => {
            window.clearTimeout(bindTimer);
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isHistoryOpen]);

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

        /* The next assistant message that arrives should type out. */
        freshIndexRef.current = -1;
        pendingAnswerRef.current = true;
        sentLengthRef.current = messages.length;

        await sendMessage(text);
        setIsHistoryOpen(false);
    }, [composerDisabled, inputText, messages.length, sendMessage]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    const handleNewChat = () => {
        freshIndexRef.current = -1;
        pendingAnswerRef.current = false;
        resetChat();
        setInputText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
        }
        setIsHistoryOpen(false);
    };

    const handleClose = () => {
        setIsAiChatOpen(false);
    };

    const handleSelectConversation = async (conversationId: string) => {
        freshIndexRef.current = -1;
        pendingAnswerRef.current = false;
        await openConversation(conversationId);
        setInputText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        setIsHistoryOpen(false);
    };

    /* Don't render the panel at all if feature is disabled */
    if (!userPermissions?.aiFeatures) return null;

    /* Determine which assistant messages are "last" for thumbs display */
    const lastAssistantIndex = messages.reduceRight(
        (acc, m, i) => (acc === -1 && m.role === 'assistant' ? i : acc),
        -1,
    );

    /* The answer that just arrived (not history) is the one that types out. */
    const lastMessage = messages[messages.length - 1];
    if (
        pendingAnswerRef.current &&
        !isLoading &&
        lastMessage?.role === 'assistant' &&
        messages.length > sentLengthRef.current
    ) {
        pendingAnswerRef.current = false;
        freshIndexRef.current = messages.length - 1;
    }
    const freshIndex = freshIndexRef.current;

    return (
        <>
            {/* Mobile backdrop (full-screen panel ≤767px) */}
            {isMobilebig && isAiChatOpen && (
                <div className="ai-chat-backdrop" onClick={handleClose} aria-hidden="true" />
            )}

            {isHistoryOpen &&
                historyDropdownPos &&
                typeof document !== 'undefined' &&
                createPortal(
                    <HistoryDropdown
                        conversations={conversations}
                        activeConversationId={activeConversationId}
                        isLoadingHistory={isLoadingHistory}
                        isLoadingMoreHistory={isLoadingMoreHistory}
                        hasMore={Boolean(nextCursor)}
                        position={historyDropdownPos}
                        onSelect={(id) => void handleSelectConversation(id)}
                        onDelete={(id) => void deleteConversation(id)}
                        onLoadMore={loadMoreConversations}
                    />,
                    document.body,
                )}

            <aside
                className={`ai-chat-panel${isAiChatOpen ? ' is-open' : ''}`}
                role="complementary"
                aria-label="Find in mail — AI chat"
                aria-hidden={!isAiChatOpen}
            >
                {/* ── Header ── */}
                <div className="ai-chat-panel__header">
                    <div className="ai-chat-panel__title-wrap">
                        <h2 className="ai-chat-panel__title">Find in mail</h2>
                        {/* <span className="ai-chat-panel__shortcut" title="Keyboard shortcut">
                            Ctrl+D
                        </span> */}
                    </div>
                    <div className="ai-chat-panel__header-actions">
                        <button
                            type="button"
                            className="ai-chat-panel__new-btn hover-link  icon-hover-effect"
                            onClick={handleNewChat}
                            title="Start a new conversation"
                        >
                            <InteractiveIcon
                                defaultIcon={folderIcon}
                                hoverIcon={folderIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="New chat"
                            />
                        </button>
                        <div className="ai-chat-panel__history-wrap" ref={historyToggleRef}>
                            <button
                                type="button"
                                className={`ai-chat-panel__history-toggle hover-link  icon-hover-effect ${isHistoryOpen ? ' is-active' : ''}`}
                                onClick={() => setIsHistoryOpen((open) => !open)}
                                aria-pressed={isHistoryOpen}
                                aria-expanded={isHistoryOpen}
                                aria-haspopup="menu"
                                aria-label={isHistoryOpen ? 'Hide chat history' : 'Show chat history'}
                            >
                                <InteractiveIcon
                                    defaultIcon={historyIcon}
                                    hoverIcon={historyIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Chat history"
                                />
                            </button>
                        </div>

                        <span className='ai-chat-icon-breaker'></span>

                        <button
                            type="button"
                            className="ai-chat-panel__close-btn hover-link  icon-hover-effect"
                            onClick={handleClose}
                            aria-label="Close AI chat panel"
                        >
                            <InteractiveIcon
                                defaultIcon={closeIcon}
                                hoverIcon={closeIcon}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="Close"
                            />
                        </button>
                    </div>
                </div>

                <div className="ai-chat-panel__content">
                    <div className="ai-chat-panel__chat">
                        {/* ── Body ── */}
                        <div className="ai-chat-panel__body" ref={bodyRef}>
                            {isOpeningConversation ? (
                                <SearchingCard text="Opening chat…" />
                            ) : messages.length === 0 && !isLoading ? (
                                <div className="ai-chat-empty">
                                    <svg className="ai-chat-empty__icon" viewBox="0 0 24 24" fill="none" stroke="#717d84" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        <path d="M11 8v3l2 2" />
                                    </svg>
                                    <p className="ai-chat-empty__title">Ask about your mail</p>
                                    <p className="ai-chat-empty__hint">
                                        Answers come from emails in Inbox. Open another folder to search there.
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
                                            animate={i === freshIndex}
                                            onTypingTick={handleTypingTick}
                                            question={
                                                messages[i - 1]?.role === 'user'
                                                    ? (messages[i - 1] as { text?: string }).text
                                                    : undefined
                                            }
                                        />
                                    ))}

                                    {isLoading && <SearchingCard text="Searching your mailbox…" />}
                                </>
                            )}
                        </div>

                        {/* ── Footer ── */}
                        <div className="ai-chat-panel__footer">
                            <p className="ai-chat-disclaimer">
                                This is an AI and can make mistakes. Please double-check responses.
                            </p>
                            <div className={`ai-chat-input-row${isLoading ? ' is-searching' : ''}`}>
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
                                    className={`btn-new ai-chat-panel__send-btn${inputText.trim() ? ' has-prompt' : ''}`}
                                    onClick={() => void handleSend()}
                                    disabled={composerDisabled || !inputText.trim()}
                                    aria-label="Send message"
                                >
                                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <path d="M3 4L19 11L3 18L4.99889 11H10.4989H4.99997L3 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}