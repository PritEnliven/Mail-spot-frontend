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
import { moveToFolder, refreshMailBox } from "@services/emailAction/emailActionService";
import { handleEmailDeletion, verifyBoxName } from "@utils/emailUtil";
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import SimpleBar from 'simplebar-react';
import { useMailData, useMailSelection, useMailUI } from '../../context/index';
import CountSkeleton from "@components/ui/CountSkeletonLoader";

const ToolbarBox = () => {
    const { pagination, boxName, sidebarState, mailListPage, fetchEmails, readUnreadFilter, fetchSearchEmails, allSearchResult, emailDetailSelected, emails,
        addNewEmail, updateBoxCount, deleteEmailState, setEmailDetailSelected, setActiveEmailMessageId, isTotalCountLoading } = useMailData();
    const { selectAllEmails, selectedEmails, clearEmailSelection } = useMailSelection();
    const { toolbarState, activeEmailMessageId, setToolbarState, openModal, setIsMailListOpen, setIsLoading } = useMailUI();
    const { markAsRead, markAsUnread, deleteEmail } = useEmailAction();
    const [moveToFolderOptions, setMoveToFolderOptions] = useState<any>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { isDesktop } = useScreen();
    // On mobile/tablet, open "Move to" below the item instead of to the right
    const moveToDropDirection = isDesktop ? "end" : "down";

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
        const isRead = emailDetailSelected?.isSeen ? true : false;
        setToolbarState({
            showBack: false,
            showSelectAll: true,
            showRefresh: false,
            showDelete: true,
            showMarkAsRead: !isRead,
            showMarkAsUnread: isRead,
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
            } else {
                const newPage = isPrevious ? mailListPage - 1 : mailListPage + 1;
                await fetchEmails(newPage, boxName, isPrevious, readUnreadFilter);
            }
        } finally {
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
            const payLoad = {
                current_active_box: boxName,
                lastEmailMessageId: emails[0]?.messageId ?? null
            }
            const response = await refreshMailBox(payLoad);
            if (response.statusCode === 200) {
                addNewEmail(response.data.emailList);
                showSuccess("loading new emails...")
            }
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    }

    const markAsReadUnreadHandler = (isRead: boolean) => {
        let messageIds: string[] = Array.from(selectedEmails) as string[];

        // If no selected emails but isMailSelected is true, use the emailDetailSelected's messageId
        if (messageIds.length === 0 && activeEmailMessageId && emailDetailSelected) {
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

        setToolbarState({
            showBack: false,
            showSelectAll: true,
            showRefresh: false,
            showDelete: true,
            showMarkAsRead: !isRead,
            showMarkAsUnread: isRead,
            showMove: false,
        });
    }

    const deleteMailHandler = () => {
        const messageIds = selectedEmails.size > 0
            ? Array.from(selectedEmails)
            : (activeEmailMessageId ? [activeEmailMessageId] : []);

        openModal('confirmDelete', {
            messageIds,
            onConfirm: () => deleteEmailToolbar(messageIds, false)
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
                                        {/* Move To Submenu — down on mobile, right on desktop */}
                                        <Dropdown drop={moveToDropDirection}>
                                            <Dropdown.Toggle
                                                as="div"
                                                className="dropdown-item react-subdropdown-menu  d-flex justify-content-between align-items-center"
                                            >
                                                Move to
                                            </Dropdown.Toggle>

                                            <Dropdown.Menu className={`react-subdropdown ${!isDesktop ? 'react-subdropdown-mobile-down' : ''}`}>
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
                                    {isTotalCountLoading ? (
                                        <CountSkeleton isTotal={true} />
                                    ) : (
                                        <span id="totalEmailCount" className="total-email-count"> {pagination.totalEmails} </span>
                                    )}
                                </>
                            )}
                        </li>
                    </ul>

                    {hasEmails && (
                        <div className="d-flex align-items-center pagination-btn-box">
                            <button
                                id="previousPageBtn"
                                className="btn hover-link icon-hover-effect"
                                onClick={() => handlePagination(true)}
                                disabled={!pagination?.hasPreviousPage}
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
                                disabled={!pagination?.hasNextPage}
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