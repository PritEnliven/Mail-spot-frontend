import InteractiveIcon from "@components/ui/InteractiveIcon";
import { clearAllToasts, showSuccess } from "@components/ui/toast/toastNotification";
import { useScreen } from "@context/ScreenContext";
import { useEmailAction } from "@hooks/useEmailAction";
import backBtnIconHover from "@images/back-btn-icon-hover.svg";
import backBtnIcon from "@images/back-btn-icon.svg";
import leftArrowPaginationIconHover from "@images/chevron-left-icon-big-hover.svg";
import leftArrowPaginationIcon from "@images/chevron-left-icon-big.svg";
import rightArrowPaginationIconHover from "@images/chevron-right-icon-big-hover.svg";
import rightArrowPaginationIcon from "@images/chevron-right-icon-big.svg";
import moreActionIconHover from "@images/ellipsis-vertical-icon-hover.svg";
import moreActionIcon from "@images/ellipsis-vertical-icon.svg";
import markAsReadIconHover from "@images/envelope-open-icon-hover.svg";
import markAsReadIcon from "@images/envelope-open-icon.svg";
import markAsUnreadIconHover from "@images/mail-icon-hover.svg";
import markAsUnreadIcon from "@images/mail-icon.svg";
import refreshIconHover from "@images/refresh-icon-hover.svg";
import refreshIcon from "@images/refresh-icon.svg";
import deleteIconHover from "@images/trash-icon-hover.svg";
import deleteIcon from "@images/trash-icon.svg";
import type { Email } from "@models/Email";
import { moveToFolder, refreshMailBox } from "@services/emailAction/emailActionService";
import { handleEmailDeletion, verifyBoxName } from "@utils/emailUtil";
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import SimpleBar from 'simplebar-react';
import { useMailData, useMailSelection, useMailUI } from '../../context/index';

function readRefreshTotal(data: unknown): number | null {
    if (!data || typeof data !== 'object') return null;
    const record = data as { totalCount?: unknown; pagination?: { totalEmails?: unknown; totalCount?: unknown } };
    const candidates = [record.totalCount, record.pagination?.totalEmails, record.pagination?.totalCount];
    for (const value of candidates) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

/** Messages strictly newer than the anchor row. Newest-first lists keep the slice before that row. */
function emailsNewerThan(incoming: Email[], anchorId: string | null, anchorDate?: string): Email[] {
    if (!incoming.length) return [];

    const anchorTime = anchorDate ? Date.parse(anchorDate) : NaN;
    if (Number.isFinite(anchorTime)) {
        return incoming.filter((email) => {
            if (!email?.messageId || email.messageId === anchorId) return false;
            const time = Date.parse(email.date);
            return Number.isFinite(time) && time > anchorTime;
        });
    }

    if (!anchorId) return incoming.filter((email) => Boolean(email?.messageId));
    const anchorIndex = incoming.findIndex((email) => email?.messageId === anchorId);
    const candidates = anchorIndex >= 0 ? incoming.slice(0, anchorIndex) : incoming;
    return candidates.filter((email) => Boolean(email?.messageId) && email.messageId !== anchorId);
}

function normalizeIncomingEmail(email: Email): Email {
    const rawAttachments = email.attachments as { attachments?: Email['attachments'] } | Email['attachments'];
    const attachments = rawAttachments && typeof rawAttachments === 'object' && 'attachments' in rawAttachments
        ? rawAttachments.attachments ?? []
        : email.attachments || [];
    return { ...email, attachments };
}

const ToolbarBox = () => {
    const { pagination, boxName, sidebarState, mailListPage, fetchEmails, readUnreadFilter, fetchSearchEmails, allSearchResult, emailDetailSelected, emails,
        setEmails, setPagination, setTotalEmailBadge, updateBoxCount, deleteEmailState, setEmailDetailSelected, setActiveEmailMessageId } = useMailData();
    const { selectAllEmails, selectedEmails, clearEmailSelection } = useMailSelection();
    const { toolbarState, activeEmailMessageId, setToolbarState, openModal, setIsMailListOpen, setIsLoading } = useMailUI();
    const { markAsRead, markAsUnread, deleteEmail } = useEmailAction();
    const [moveToFolderOptions, setMoveToFolderOptions] = useState<any>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { isDesktop, isMobile } = useScreen();

    // Hide pagination when mailbox is empty (all counts are 0)
    // const hasEmails = pagination?.startCount != null && pagination?.endCount != null && pagination?.totalEmails != null
    //     && (emails.length > 0);

    const hasEmails = pagination?.startCount != null && pagination?.endCount != null
        && (emails.length > 0);

    //create moveTo folder options list from sidebarSteate

    useEffect(() => {
        const originalBoxes = sidebarState.boxes.filter((box) => box.value !== boxName && !verifyBoxName(box.value, 'draft') && !verifyBoxName(box.value, 'scheduled'));
        const customBoxes = sidebarState.customBoxes.filter((box) => box.value !== boxName);
        setMoveToFolderOptions({
            boxes: originalBoxes,
            customBoxes: customBoxes
        })
        if (selectedEmails.size === 0) {
            const checkboxAll = document.getElementById('checkboxAll') as HTMLInputElement | null;
            if (checkboxAll) {
                checkboxAll.checked = false;
            }
        }
    }, [sidebarState, boxName, selectedEmails]);

    const handleSelectAllEmails = () => {
        selectAllEmails();
    }

    const handleBack = () => {
        // TODO: implement back logic
        setIsMailListOpen(true);
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
            setEmailDetailSelected(null);
            setActiveEmailMessageId(null);
        }
    };

    const handlePagination = async (isPrevious: boolean) => {
        setIsLoading(true);
        try {
            if (allSearchResult) {
                await fetchSearchEmails(isPrevious);
            } 
            else {
                const newPage = isPrevious ? mailListPage - 1 : mailListPage + 1;
                await fetchEmails(newPage, boxName, isPrevious, readUnreadFilter);
            }
        } 
        finally {
            setIsLoading(false);
            // Scroll to the top of the email list
            const emailListRef = document.getElementById('email-list') as HTMLDivElement | null;
            if (emailListRef) {                                                
                emailListRef.scrollTop = 0;                                                
            }
        }
    };

    const refreshMailBoxHandler = async () => {
        // Clear any existing toast notifications immediately
        clearAllToasts();

        // Prevent multiple clicks if already refreshing
        if (isRefreshing) return;

        setIsRefreshing(true);

        try {
            const newest = emails[0];
            const newestMessageId = newest?.messageId ?? '';
            const response = await refreshMailBox({
                current_active_box: boxName,
                lastEmailMessageId: newestMessageId,
            });
            if (response.statusCode === 200) {
                const incoming = Array.isArray(response.data?.emailList) ? response.data.emailList as Email[] : [];
                const newer = emailsNewerThan(incoming, newestMessageId || null, newest?.date);
                const totalCount = readRefreshTotal(response.data);

                if (totalCount !== null) {
                    setTotalEmailBadge(totalCount);
                }

                if (mailListPage <= 1) {
                    const pageSize = pagination?.emailsPerPage && pagination.emailsPerPage > 0
                        ? pagination.emailsPerPage
                        : emails.length;
                    const seen = new Set(emails.map((email) => email.messageId));
                    const fresh = newer
                        .filter((email) => email.messageId && !seen.has(email.messageId))
                        .map(normalizeIncomingEmail);
                    const merged = [...fresh, ...emails];
                    const trimmed = pageSize > 0 ? merged.slice(0, pageSize) : merged;
                    setEmails(trimmed);

                    if (pagination) {
                        const start = pagination.startCount || 1;
                        const totalEmails = totalCount ?? pagination.totalEmails;
                        const totalPages = pageSize > 0 && totalEmails > 0
                            ? Math.ceil(totalEmails / pageSize)
                            : pagination.totalPages;
                        const currentPage = pagination.currentPage || mailListPage;
                        setPagination({
                            ...pagination,
                            totalEmails,
                            totalPages,
                            startCount: start,
                            endCount: trimmed.length ? start + trimmed.length - 1 : start,
                            hasNextPage: totalPages > 0 ? currentPage < totalPages : pagination.hasNextPage,
                            hasPreviousPage: currentPage > 1,
                        });
                    }
                } else if (pagination && totalCount !== null) {
                    const pageSize = pagination.emailsPerPage > 0 ? pagination.emailsPerPage : 0;
                    const totalPages = pageSize > 0
                        ? Math.ceil(totalCount / pageSize)
                        : pagination.totalPages;
                    const currentPage = pagination.currentPage || mailListPage;
                    setPagination({
                        ...pagination,
                        totalEmails: totalCount,
                        totalPages,
                        hasNextPage: totalPages > 0 ? currentPage < totalPages : pagination.hasNextPage,
                        hasPreviousPage: currentPage > 1,
                    });
                }

                showSuccess("Loading new emails...")
            }
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    }

    const markAsReadUnreadHandler = (isRead: boolean) => {
        let messageIds: string[] = Array.from(selectedEmails) as string[];
        const markingOpenEmail =
            messageIds.length === 0 && !!activeEmailMessageId && !!emailDetailSelected;

        // If no selected emails but an email is open, act on the open email
        if (markingOpenEmail) {
            messageIds = [emailDetailSelected.messageId];
        }

        if (messageIds.length > 0) {
            if (isRead) {
                markAsRead(messageIds);
            } else {
                markAsUnread(messageIds);
            }
        }

        // Clear selection without triggering select-all logic
        clearEmailSelection();

        // Visually uncheck the master checkbox without firing its click handler
        const checkboxAll = document.getElementById('checkboxAll') as HTMLInputElement | null;

        if (checkboxAll) {
            checkboxAll.checked = false;
        }

        // On <=992, Mark as unread returns to the mail list (inbox) view
        if (!isDesktop && !isRead && (markingOpenEmail || !!activeEmailMessageId)) {
            setIsMailListOpen(true);
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
            return;
        }

        if (!isDesktop && markingOpenEmail && activeEmailMessageId) {
            setToolbarState({
                showBack: true,
                showSelectAll: false,
                showRefresh: true,
                showDelete: true,
                showMarkAsRead: !isRead,
                showMarkAsUnread: isRead,
                showMove: true,
            });
            return;
        }

        // Desktop / selection: hide Mark as Read/Unread after clearing selection
        setToolbarState({
            showBack: false,
            showSelectAll: true,
            showRefresh: true,
            showDelete: !!activeEmailMessageId,
            showMarkAsRead: false,
            showMarkAsUnread: false,
            showMove: !!activeEmailMessageId,
        });
    }

    const deleteMailHandler = () => {
        const messageIds = selectedEmails.size > 0
            ? Array.from(selectedEmails)
            : (activeEmailMessageId ? [activeEmailMessageId] : []);

        openModal('confirmDelete', {
            messageIds,
            onConfirm: () => deleteEmailToolbar(messageIds, verifyBoxName(boxName, 'draft'))
        });
    }

    const deleteEmailToolbar = async (messageIds: string[], isDraftEmail: boolean) => {
        return handleEmailDeletion(messageIds, isDraftEmail, {
            deleteFn: deleteEmail,
            successMessage: 'Email deleted successfully',
            errorMessage: 'Failed to delete email'
        });
    }

    const moveToFolderHandler = async (folderName: string) => {
        const messageIds = selectedEmails.size > 0
            ? Array.from(selectedEmails)
            : (activeEmailMessageId ? [activeEmailMessageId] : []);

        const payload = {
            messageIds: messageIds as string[],
            current_active_box: boxName,
            folder: folderName
        }

        // const response = await markedAsLabel(payload);
        const response = await moveToFolder(payload);

        if (response.statusCode === 200) {
            showSuccess("Email moved successfully");

            // now after moving update count to that specific box update it's sidebar unread count if trash then don't read/unread just set that total selectedEmail count in trash increase it. and then remove that emails from list and clear email selection.
            const movedEmailIds = messageIds as string[];
            const movedEmails = emails.filter(email => movedEmailIds.includes(email.messageId));

            // Update counts for the target folder
            if (verifyBoxName(folderName, 'trash') || verifyBoxName(folderName, 'junk')) {
                // For trash: increase total count by number of moved emails
                updateBoxCount(folderName, 0, movedEmails.length);
            }

            else {
                // For other folders: update unread count based on read/unread status of moved emails
                const unreadMovedCount = movedEmails.filter(email => !email.isSeen).length;
                updateBoxCount(folderName, unreadMovedCount, movedEmails.length);
            }

            // Update counts for the source folder (current box)
            const unreadRemovedCount = movedEmails.filter(email => !email.isSeen).length;
            updateBoxCount(boxName, -unreadRemovedCount, -movedEmails.length);

            const remainingEmails = emails.filter(email => !movedEmailIds.includes(email.messageId));
            deleteEmailState(movedEmailIds, true);

            if (activeEmailMessageId && movedEmailIds.includes(activeEmailMessageId)) {
                setEmailDetailSelected(null);
                setActiveEmailMessageId(null);
            }

            clearEmailSelection();

            // Visually uncheck the master checkbox without firing its click handler
            const checkboxAll = document.getElementById('checkboxAll') as HTMLInputElement | null;
            if (checkboxAll) {
                checkboxAll.checked = false;
            }

            if (remainingEmails.length === 0) {
                const targetPage = mailListPage > 1 ? mailListPage - 1 : 1;
                await fetchEmails(targetPage, boxName);
            }

        }
    }

    const createFolderHandler = () => {
        openModal('createCustomFolder');
    }

    const openMoveToFolderSheet = () => {
        openModal('moveToFolder', {
            onSelectFolder: moveToFolderHandler,
        });
    }

    const isAllSelected = emails.length > 0 && selectedEmails.size === emails.length;
    const isIndeterminate = selectedEmails.size > 0 && selectedEmails.size < emails.length;

    return (
        <>
            <div className="Tool-bar-box d-flex align-items-center justify-content-between" id="toolBarBox">
                <div className="d-flex align-items-center">
                    <div className={`checkbox-group d-flex align-items-center ${toolbarState.showSelectAll ? '' : 'd-none'}`} id="toolBarCheckboxGroup">
                        <div className="checkbox-custom table-check me-1" id="checkBoxAllSection">
                            <input className="list-child"
                                type="checkbox"
                                id="checkboxAll"
                                name="checkbox"
                                checked={isAllSelected}
                                ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                                onClick={handleSelectAllEmails} />
                            <label htmlFor="checkboxAll" className="label-text" />
                        </div>
                    </div>

                    <div className="checkbox-group-2 d-flex align-items-center">
                        <a href="#" id="mail-message-box-back-show" className={`icon-hover-effect hover-link ${toolbarState.showBack ? 'd-flex' : 'd-none'}`} onClick={handleBack}>
                            <InteractiveIcon
                                defaultIcon={backBtnIcon}
                                hoverIcon={backBtnIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="Back"
                            />
                        </a>

                        <a
                            href="#"
                            id="refreshEmailBtn"
                            className={`hover-link d-flex align-items-center icon-hover-effect ${toolbarState.showRefresh ? '' : 'd-none'} ${isRefreshing ? 'disabled' : ''}`}
                            onClick={refreshMailBoxHandler}
                            style={{ opacity: isRefreshing ? 0.5 : 1, pointerEvents: isRefreshing ? 'none' : 'auto' }}
                        >
                            <InteractiveIcon
                                defaultIcon={refreshIcon}
                                hoverIcon={refreshIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="Refresh"
                            />
                        </a>

                        {hasEmails && (
                            <div id="actionButtons" className="d-flex align-items-center action-buttons">
                                <a
                                    href="#"
                                    id="markAsReadUnreadBtn"
                                    className={`hover-link d-flex align-items-center icon-hover-effect ${toolbarState.showMarkAsUnread || toolbarState.showMarkAsRead ? '' : 'd-none'
                                        }`}
                                    onClick={() => {
                                        if (toolbarState.showMarkAsUnread) {
                                            markAsReadUnreadHandler(false);
                                        } else if (toolbarState.showMarkAsRead) {
                                            markAsReadUnreadHandler(true);
                                        }
                                    }}
                                >
                                    <InteractiveIcon
                                        defaultIcon={
                                            toolbarState.showMarkAsUnread
                                                ? markAsUnreadIcon
                                                : markAsReadIcon
                                        }
                                        hoverIcon={
                                            toolbarState.showMarkAsUnread
                                                ? markAsUnreadIconHover
                                                : markAsReadIconHover
                                        }
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip={
                                            toolbarState.showMarkAsUnread
                                                ? "Mark as unread"
                                                : "Mark as read"
                                        }
                                    />
                                </a>

                                <a
                                    href="#"
                                    id="toolbarDeleteBtn"
                                    className={`hover-link d-flex align-items-center icon-hover-effect ${toolbarState.showDelete ? '' : 'd-none'}`}
                                    onClick={deleteMailHandler}
                                >
                                    <InteractiveIcon
                                        defaultIcon={deleteIcon}
                                        hoverIcon={deleteIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Delete"
                                    />
                                </a>

                                <Dropdown
                                    className={`more-actions-dropdown me-2 react-dropdown ${toolbarState.showMove ? '' : 'd-none'}`}
                                >
                                    <Dropdown.Toggle
                                        as="a"
                                        className="hover-link d-flex align-items-center icon-hover-effect"
                                    >
                                        <InteractiveIcon
                                            defaultIcon={moreActionIcon}
                                            hoverIcon={moreActionIconHover}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip="More"
                                        />
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        {/* ≤575px: bottom sheet. Wider screens: nested submenu. */}
                                        {isMobile ? (
                                            <Dropdown.Item
                                                className="d-flex justify-content-between align-items-center"
                                                onClick={openMoveToFolderSheet}
                                            >
                                                Move to
                                            </Dropdown.Item>
                                        ) : (
                                            <Dropdown drop="end">
                                                <Dropdown.Toggle
                                                    as="div"
                                                    className="dropdown-item react-subdropdown-menu  d-flex justify-content-between align-items-center"
                                                >
                                                    Move to
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu className="react-subdropdown">
                                                    <SimpleBar
                                                        className="eventInfoModalSimpleBar"
                                                        autoHide={false}
                                                        forceVisible="y"
                                                        style={{ maxHeight: '300px' }}
                                                    >
                                                        {moveToFolderOptions.boxes && moveToFolderOptions.boxes.map((box: any) => (
                                                            <Dropdown.Item key={box.value} onClick={() => moveToFolderHandler(box.value)}>
                                                                {box.key}
                                                            </Dropdown.Item>
                                                        ))}

                                                        {moveToFolderOptions.customBoxes?.length > 0 && (
                                                            <>
                                                                <Dropdown.Divider />

                                                                {moveToFolderOptions.customBoxes.map((box: any) => (
                                                                    <Dropdown.Item
                                                                        key={box.value.value}
                                                                        onClick={() => moveToFolderHandler(box.value.value)}
                                                                    >
                                                                        {box.key}
                                                                    </Dropdown.Item>
                                                                ))}
                                                            </>
                                                        )}

                                                        <Dropdown.Divider />

                                                        <Dropdown.Item onClick={() => createFolderHandler()}>
                                                            Create folder
                                                        </Dropdown.Item>
                                                    </SimpleBar>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        )}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="pagination-box d-flex align-items-center">
                    <ul className="pagination-cus me-3">
                        <li className="pagination-count pagination-count-skeleton">
                            <span id="emailRange" className="email-count" />
                            {hasEmails && (
                                <>
                                    <span className="of me-1">{pagination.startCount} - {pagination.endCount}</span>
                                    <span className="of me-1"> of </span>
                                    <span id="totalEmailCount" className="total-email-count"> {pagination.totalEmails} </span>
                                </>
                            )}
                        </li>
                    </ul>

                    {/* On mobile/tablet with an open email, hide prev/next — swipe navigates instead */}
                    {hasEmails && (isDesktop || !activeEmailMessageId) && (
                        <div className="d-flex align-items-center pagination-btn-box">
                            <button
                                id="previousPageBtn"
                                className="btn hover-link icon-hover-effect"
                                onClick={() => handlePagination(true)}
                                disabled={!pagination?.hasPreviousPage || (pagination.currentPage || mailListPage) <= 1}
                            >
                                <InteractiveIcon
                                    defaultIcon={leftArrowPaginationIcon}
                                    hoverIcon={leftArrowPaginationIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Previous"
                                />
                            </button>

                            <button
                                id="nextPageBtn"
                                className="btn hover-link icon-hover-effect"
                                onClick={() => handlePagination(false)}
                                disabled={
                                    !pagination?.hasNextPage
                                    || (pagination.totalPages > 0 && (pagination.currentPage || mailListPage) >= pagination.totalPages)
                                }
                            >
                                <InteractiveIcon
                                    defaultIcon={rightArrowPaginationIcon}
                                    hoverIcon={rightArrowPaginationIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Next"
                                />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ToolbarBox;