import InteractiveIcon from "@components/ui/InteractiveIcon";
import ArrangeByControl from "@components/ui/email/ArrangeByControl";
import {
    dismissToast,
    showError,
    showMovingEmailToast,
    showProgressToast,
    showSuccess,
    showWarning,
} from "@components/ui/toast/toastNotification.ts";
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
import exportIconHover from "@images/export-icon-hover.svg";
import exportIcon from "@images/export-icon.svg";
import exportFolderIconHover from "@images/export-folder-icon-hover.svg";
import exportFolderIcon from "@images/export-folder-icon.svg";
import uploadFileIconHover from "@images/upload-file-icon-hover.svg";
import uploadFileIcon from "@images/upload-file-icon.svg";
import type { Email } from "@models/Email";
import { moveToFolder, refreshMailBox } from "@services/emailAction/emailActionService";
import {
    downloadBlobFile,
    exportEml,
    importEml,
    moveToImap,
    moveToLocalFolder,
    validateEmlFilesForImport,
} from "@services/localFolder/localFolderService";
import { DEFAULT_SORT_ORDER } from "@constants/arrangeBy";
import { mergeIntoArrangedList } from "@utils/arrangeEmailUtil";
import { getLocalFolderIdFromBoxName, handleEmailDeletion, isLocalBoxName, verifyBoxName } from "@utils/emailUtil";
import React, { useEffect, useRef, useState } from "react";
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
        setEmails, setPagination, setTotalEmailBadge, updateBoxCount, deleteEmailState, setEmailDetailSelected, setActiveEmailMessageId, boxTitle, arrangeBy, sortOrder, setSidebarStateFromAPI } = useMailData();
    const { selectAllEmails, selectedEmails, clearEmailSelection } = useMailSelection();
    const { toolbarState, activeEmailMessageId, setToolbarState, openModal, setIsMailListOpen, setIsLoading } = useMailUI();
    const { markAsRead, markAsUnread, deleteEmail } = useEmailAction();
    const [moveToFolderOptions, setMoveToFolderOptions] = useState<any>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isImportingEml, setIsImportingEml] = useState(false);
    const [isExportingEml, setIsExportingEml] = useState(false);
    const importEmlInputRef = useRef<HTMLInputElement | null>(null);
    const { isDesktop, isMobile } = useScreen();
    const isSchedule = boxName?.toLocaleLowerCase().includes('schedule');
    const isLocalFolderView = isLocalBoxName(boxName);
    const isSearchOrFilterMailList = allSearchResult || boxTitle === 'Search Results';
    const showArrangeBy = !isSearchOrFilterMailList && !isSchedule;
    const boxNameRef = useRef(boxName);
    boxNameRef.current = boxName;

    const resolveSelectedMessageIds = () =>
        selectedEmails.size > 0
            ? Array.from(selectedEmails)
            : (activeEmailMessageId ? [activeEmailMessageId] : []);

    // Hide pagination when mailbox is empty (all counts are 0)
    // const hasEmails = pagination?.startCount != null && pagination?.endCount != null && pagination?.totalEmails != null
    //     && (emails.length > 0);

    const hasEmails = pagination?.startCount != null && pagination?.endCount != null
        && (emails.length > 0);

    //create moveTo folder options list from sidebarSteate

    useEffect(() => {
        // From a local folder, IMAP destinations are allowed via /localFolder/moveToImap
        const originalBoxes = sidebarState.boxes.filter(
            (box) => box.value !== boxName && !verifyBoxName(box.value, 'draft') && !verifyBoxName(box.value, 'scheduled')
        );
        const customBoxes = sidebarState.customBoxes.filter(
            (box) => box.value !== boxName && box.value?.value !== boxName
        );
        const localFolders = (sidebarState.localFolders || []).filter(
            (folder: any) => (folder.value || folder.key) !== boxName
        );
        setMoveToFolderOptions({
            boxes: originalBoxes,
            customBoxes: customBoxes,
            localFolders,
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

    const scrollMailListToTop = () => {
        const scrollEl = document.querySelector(
            '.mailReceivedTableNewsSimpleBar .simplebar-content-wrapper'
        ) as HTMLElement | null;
        if (scrollEl) {
            scrollEl.scrollTop = 0;
        }
        const emailListRef = document.getElementById('email-list');
        if (emailListRef) {
            emailListRef.scrollTop = 0;
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
            // Wait for list re-render (incl. arrange group headers) before resetting scroll
            setTimeout(scrollMailListToTop, 0);
            requestAnimationFrame(() => {
                scrollMailListToTop();
                requestAnimationFrame(scrollMailListToTop);
            });
        }
    };

    const refreshMailBoxHandler = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        // Prevent multiple clicks if already refreshing
        if (isRefreshing) return;

        // Local folders are DB-only — re-fetch the list instead of IMAP refresh
        if (isLocalFolderView) {
            setIsRefreshing(true);
            try {
                await fetchEmails(mailListPage || 1, boxName);
                showSuccess('Local folder refreshed');
            } catch (error: any) {
                showError(error?.message || 'Failed to refresh local folder');
            } finally {
                setIsRefreshing(false);
            }
            return;
        }

        setIsRefreshing(true);
        // Match refresh-loader-spin (0.8s) so at least one full rotation always shows
        const minSpinMs = 800;
        const spinStartedAt = Date.now();

        try {
            const newest = emails[0];
            const newestMessageId = newest?.messageId ?? '';
            const response = await refreshMailBox({
                current_active_box: boxName,
                lastEmailMessageId: newestMessageId,
            });
            if (response.statusCode === 200) {
                const incoming = Array.isArray(response.data?.emailList)
                    ? response.data.emailList as Email[]
                    : [];

                // Empty emailList means "no new mail" — response pagination/total can be
                // zeroed and must not overwrite the current badge or folder counts.
                if (incoming.length === 0) {
                    return;
                }

                const newer = emailsNewerThan(incoming, newestMessageId || null, newest?.date);
                const totalCount = readRefreshTotal(response.data);

                if (totalCount !== null && totalCount > 0) {
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

                    const merged = arrangeBy
                        ? mergeIntoArrangedList(
                            emails,
                            fresh,
                            arrangeBy,
                            sortOrder ?? DEFAULT_SORT_ORDER[arrangeBy],
                        )
                        : [...fresh, ...emails];
                    const trimmed = pageSize > 0 ? merged.slice(0, pageSize) : merged;
                    setEmails(trimmed);

                    if (pagination) {
                        const start = pagination.startCount || 1;
                        const totalEmails = (totalCount !== null && totalCount > 0)
                            ? totalCount
                            : pagination.totalEmails;
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
                } else if (pagination && totalCount !== null && totalCount > 0) {
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

            }
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            const remainingSpinMs = minSpinMs - (Date.now() - spinStartedAt);
            if (remainingSpinMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, remainingSpinMs));
            }
            setIsRefreshing(false);
        }
    }

    const formatImportEmlSummary = (summary: {
        imported: number;
        alreadyExists: number;
        failed: number;
    }) =>
        `Imported ${summary.imported} · Already existed ${summary.alreadyExists} · Failed ${summary.failed}`;

    const openImportEmlPicker = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (!isLocalFolderView || isImportingEml) return;
        importEmlInputRef.current?.click();
    };

    const handleImportEmlFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // Snapshot first — FileList is live; clearing value empties it.
        const files = event.target.files ? Array.from(event.target.files) : [];
        // Allow selecting the same file again later
        event.target.value = '';

        if (!isLocalFolderView || isImportingEml) return;

        const folderId = getLocalFolderIdFromBoxName(boxName);
        if (!folderId) {
            showError('Invalid local folder');
            return;
        }

        const validationError = validateEmlFilesForImport(files);
        if (validationError) {
            showError(validationError);
            return;
        }

        setIsImportingEml(true);
        const progressToastId = showProgressToast('Importing EML…');
        try {
            const result = await importEml(folderId, files);
            dismissToast(progressToastId);

            if (!result.success) {
                if (result.statusCode !== 401) {
                    showError(result.message || 'Failed to import EML');
                }
                return;
            }

            const { summary } = result;
            const summaryText = formatImportEmlSummary(summary);

            if (summary.imported > 0 || summary.alreadyExists > 0) {
                await fetchEmails(mailListPage || 1, boxName);
                setSidebarStateFromAPI().catch(() => {});
            }

            if (summary.failed > 0 && (summary.imported > 0 || summary.alreadyExists > 0)) {
                showWarning(summaryText);
            } else if (summary.failed > 0 && summary.imported === 0 && summary.alreadyExists === 0) {
                showError(summaryText);
            } else {
                showSuccess(summaryText);
            }
        } catch (error: any) {
            dismissToast(progressToastId);
            showError(error?.message || 'Failed to import EML');
        } finally {
            setIsImportingEml(false);
        }
    };

    const handleExportEml = async () => {
        if (!isLocalFolderView || isExportingEml) return;

        const messageIds = resolveSelectedMessageIds();
        if (messageIds.length === 0) {
            showError('No emails selected');
            return;
        }

        setIsExportingEml(true);
        const progressToastId =
            messageIds.length > 1 ? showProgressToast('Exporting as EML…') : undefined;
        try {
            const result = await exportEml({ messageIds });
            dismissToast(progressToastId);

            if (!result.success) {
                if (result.statusCode !== 401) {
                    const failedPreview = result.failed
                        ?.slice(0, 3)
                        .map((f) => f.reason || f.messageId)
                        .filter(Boolean)
                        .join('; ');
                    showError(
                        failedPreview
                            ? `${result.message}: ${failedPreview}`
                            : result.message || 'Failed to export as EML'
                    );
                }
                return;
            }

            downloadBlobFile(result.blob, result.filename);
            const isZip = /\.zip$/i.test(result.filename);
            showSuccess(
                isZip
                    ? 'Thread exported as ZIP'
                    : messageIds.length === 1
                      ? 'Email exported as EML'
                      : `${messageIds.length} emails exported as EML`
            );
        } catch (error: any) {
            dismissToast(progressToastId);
            showError(error?.message || 'Failed to export as EML');
        } finally {
            setIsExportingEml(false);
        }
    };

    const handleExportFolder = async () => {
        if (!isLocalFolderView || isExportingEml) return;

        const folderId = getLocalFolderIdFromBoxName(boxName);
        if (!folderId) {
            showError('Folder not found');
            return;
        }

        setIsExportingEml(true);
        const progressToastId = showProgressToast('Exporting folder…');
        try {
            const result = await exportEml({ folderId });
            dismissToast(progressToastId);

            if (!result.success) {
                if (result.statusCode !== 401) {
                    showError(result.message || 'Failed to export folder');
                }
                return;
            }

            downloadBlobFile(result.blob, result.filename);
            showSuccess(
                /\.zip$/i.test(result.filename) ? 'Folder exported as ZIP' : 'Folder exported as EML'
            );
        } catch (error: any) {
            dismissToast(progressToastId);
            showError(error?.message || 'Failed to export folder');
        } finally {
            setIsExportingEml(false);
        }
    };

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

    const applyMovedEmailsToUi = async (
        movedEmailIds: string[],
        targetFolderKey: string,
        sourceBoxName: string,
        sourceEmails: Email[],
        sourcePage: number,
    ) => {
        if (movedEmailIds.length === 0) return;

        const movedEmails = sourceEmails.filter(email => movedEmailIds.includes(email.messageId));

        if (verifyBoxName(targetFolderKey, 'trash') || verifyBoxName(targetFolderKey, 'junk')) {
            updateBoxCount(targetFolderKey, 0, movedEmails.length);
        } else {
            const unreadMovedCount = movedEmails.filter(email => !email.isSeen).length;
            updateBoxCount(targetFolderKey, unreadMovedCount, movedEmails.length);
        }

        const unreadRemovedCount = movedEmails.filter(email => !email.isSeen).length;
        updateBoxCount(sourceBoxName, -unreadRemovedCount, -movedEmails.length);

        const currentBox = boxNameRef.current;
        const stillOnSource = currentBox === sourceBoxName;
        const viewingTarget = currentBox === targetFolderKey;

        if (stillOnSource) {
            const remainingEmails = sourceEmails.filter(
                email => !movedEmailIds.includes(email.messageId),
            );
            deleteEmailState(movedEmailIds, true);

            if (remainingEmails.length === 0) {
                const targetPage = sourcePage > 1 ? sourcePage - 1 : 1;
                await fetchEmails(targetPage, sourceBoxName);
            }
        } else if (viewingTarget) {
            // User opened the destination while the move was in flight — refresh it
            // instead of deleting source IDs from the destination list.
            await fetchEmails(1, targetFolderKey);
        }

        if (activeEmailMessageId && movedEmailIds.includes(activeEmailMessageId)) {
            setEmailDetailSelected(null);
            setActiveEmailMessageId(null);
        }

        clearEmailSelection();

        const checkboxAll = document.getElementById('checkboxAll') as HTMLInputElement | null;
        if (checkboxAll) {
            checkboxAll.checked = false;
        }
    };

    const moveToFolderHandler = async (folderName: string) => {
        const messageIds = selectedEmails.size > 0
            ? Array.from(selectedEmails)
            : (activeEmailMessageId ? [activeEmailMessageId] : []);

        if (messageIds.length === 0) return;

        const sourceBoxName = boxName;
        const sourceEmails = emails;
        const sourcePage = mailListPage;

        const applyPartialMoveResult = async (
            response: any,
            targetKey: string,
            successFallback: string,
            failureFallback: string
        ) => {
            const resultBody =
                response?.data &&
                (Array.isArray(response.data.moved) || Array.isArray(response.data.failed))
                    ? response.data
                    : response;

            const moved: string[] = Array.isArray(resultBody?.moved) ? resultBody.moved : [];
            const failed: Array<{ messageId: string; reason?: string }> = Array.isArray(resultBody?.failed)
                ? resultBody.failed
                : [];
            const resultMessage =
                (typeof resultBody?.message === 'string' ? resultBody.message : undefined) ||
                (typeof response?.message === 'string' ? response.message : undefined);

            if (moved.length > 0) {
                showSuccess(resultMessage || successFallback.replace('{n}', String(moved.length)));
                await applyMovedEmailsToUi(
                    moved,
                    targetKey,
                    sourceBoxName,
                    sourceEmails,
                    sourcePage,
                );
                setSidebarStateFromAPI().catch(() => {});
            }

            if (failed.length > 0) {
                const preview = failed
                    .slice(0, 3)
                    .map((f) => f.reason || f.messageId)
                    .join('; ');
                showError(
                    `${failed.length} email(s) could not be moved${preview ? `: ${preview}` : ''}`
                );
            }

            if (moved.length === 0 && failed.length === 0) {
                const message = resultMessage || response?.error || failureFallback;
                showError(typeof message === 'string' ? message : failureFallback);
            }

            // Treat HTTP 200 with moved ids (or legacy full-success status) as success for callers
            return moved.length > 0 || response?.statusCode === 200;
        };

        // Move into a local folder
        if (isLocalBoxName(folderName)) {
            const folderId = getLocalFolderIdFromBoxName(folderName);
            if (!folderId) {
                showError('Invalid local folder');
                return;
            }

            const localFolder = (sidebarState.localFolders || []).find(
                (folder: any) =>
                    folder.folderId === folderId ||
                    (folder.value || folder.key) === folderName
            );
            const folderDisplayName =
                localFolder?.displayName || localFolder?.key || 'local folder';
            const movingToastId = showMovingEmailToast(`${folderDisplayName} (Local)`);

            try {
                const response: any = await moveToLocalFolder({
                    messageIds: messageIds as string[],
                    folderId,
                });

                dismissToast(movingToastId);
                await applyPartialMoveResult(
                    response,
                    folderName,
                    '{n} email(s) moved to local folder',
                    'Failed to move emails to local folder'
                );
            } catch (error) {
                dismissToast(movingToastId);
                throw error;
            }
            return;
        }

        // From a local folder (or local-only emails): restore to IMAP via dedicated API
        const selectedList = emails.filter(e => messageIds.includes(e.messageId));
        const hasLocalOnly = selectedList.some(e => e.isLocalOnly) || isLocalFolderView;
        if (hasLocalOnly) {
            const sourceFolderId = getLocalFolderIdFromBoxName(boxName) || undefined;
            const imapFolder =
                sidebarState.boxes.find((box: any) => box.value === folderName) ||
                sidebarState.customBoxes.find(
                    (box: any) => box.value === folderName || box.value?.value === folderName
                );
            const folderDisplayName =
                imapFolder?.displayName || imapFolder?.key || folderName;
            const movingToastId = showMovingEmailToast(folderDisplayName);

            try {
                const response: any = await moveToImap({
                    messageIds: messageIds as string[],
                    destinationFolder: folderName,
                    folderId: sourceFolderId,
                });

                dismissToast(movingToastId);
                await applyPartialMoveResult(
                    response,
                    folderName,
                    '{n} email(s) moved to mailbox',
                    'Failed to move emails to mailbox'
                );
            } catch (error) {
                dismissToast(movingToastId);
                throw error;
            }
            return;
        }

        const payload = {
            messageIds: messageIds as string[],
            current_active_box: boxName,
            folder: folderName
        }

        const response = await moveToFolder(payload);

        if (response.statusCode === 200) {
            showSuccess("Email moved successfully");
            await applyMovedEmailsToUi(
                messageIds as string[],
                folderName,
                sourceBoxName,
                sourceEmails,
                sourcePage,
            );
        }
    }

    const createFolderHandler = () => {
        openModal('createCustomFolder');
    }

    const createLocalFolderHandler = () => {
        openModal('createLocalFolder');
    }

    const openMoveToFolderSheet = () => {
        openModal('moveToFolder', {
            onSelectFolder: moveToFolderHandler,
        });
    }

    const isAllSelected = emails.length > 0 && selectedEmails.size === emails.length;
    const isIndeterminate = selectedEmails.size > 0 && selectedEmails.size < emails.length;
    const canExportEml = isLocalFolderView && !isExportingEml && resolveSelectedMessageIds().length > 0;
    const canExportFolder = isLocalFolderView && !isExportingEml && !!getLocalFolderIdFromBoxName(boxName);

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
                            className={`hover-link d-flex align-items-center icon-hover-effect ${toolbarState.showRefresh ? '' : 'd-none'}${isRefreshing ? ' refresh-loader' : ''}`}
                            onClick={refreshMailBoxHandler}
                            style={{ cursor: isRefreshing ? 'default' : 'pointer' }}
                            aria-label="Refresh"
                            aria-busy={isRefreshing}
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

                        {isLocalFolderView && (
                            <>
                                <input
                                    ref={importEmlInputRef}
                                    type="file"
                                    accept=".eml,.zip,message/rfc822,application/zip"
                                    multiple
                                    className="d-none"
                                    aria-hidden="true"
                                    tabIndex={-1}
                                    onChange={handleImportEmlFiles}
                                />
                                <a
                                    href="#"
                                    id="importEmlBtn"
                                    className={`hover-link d-flex align-items-center icon-hover-effect${isImportingEml ? ' disabled' : ''}`}
                                    onClick={openImportEmlPicker}
                                    style={{ cursor: isImportingEml ? 'default' : 'pointer' }}
                                    aria-label="Import EML"
                                    aria-busy={isImportingEml}
                                >
                                    <InteractiveIcon
                                        defaultIcon={uploadFileIcon}
                                        hoverIcon={uploadFileIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Import EML / ZIP"
                                    />
                                </a>
                                <a
                                    href="#"
                                    id="exportEmlBtn"
                                    className={`hover-link d-flex align-items-center icon-hover-effect${!canExportEml ? ' disabled' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        void handleExportEml();
                                    }}
                                    style={{
                                        cursor: canExportEml ? 'pointer' : 'default',
                                        opacity: canExportEml ? 1 : 0.45,
                                    }}
                                    aria-label="Export as EML"
                                    aria-busy={isExportingEml}
                                    aria-disabled={!canExportEml}
                                >
                                    <InteractiveIcon
                                        defaultIcon={exportIcon}
                                        hoverIcon={exportIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Export as EML"
                                    />
                                </a>
                                <a
                                    href="#"
                                    id="exportFolderBtn"
                                    className={`hover-link d-flex align-items-center icon-hover-effect${!canExportFolder ? ' disabled' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        void handleExportFolder();
                                    }}
                                    style={{
                                        cursor: canExportFolder ? 'pointer' : 'default',
                                        opacity: canExportFolder ? 1 : 0.45,
                                    }}
                                    aria-label="Export folder"
                                    aria-busy={isExportingEml}
                                    aria-disabled={!canExportFolder}
                                >
                                    <InteractiveIcon
                                        defaultIcon={exportFolderIcon}
                                        hoverIcon={exportFolderIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Export folder"
                                    />
                                </a>
                            </>
                        )}

                        {showArrangeBy && (
                            <div className="arrange-by-toolbar">
                                <ArrangeByControl />
                            </div>
                        )}

                        { hasEmails && (
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

                                                        {moveToFolderOptions.localFolders?.length > 0 && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Header>Archived Mail</Dropdown.Header>
                                                                {moveToFolderOptions.localFolders.map((folder: any) => (
                                                                    <Dropdown.Item
                                                                        key={folder.folderId || folder.value || folder.key}
                                                                        onClick={() => moveToFolderHandler(folder.value || folder.key)}
                                                                    >
                                                                        {folder.displayName || folder.key}
                                                                    </Dropdown.Item>
                                                                ))}
                                                            </>
                                                        )}

                                                        <Dropdown.Divider />

                                                        {!isLocalFolderView && (
                                                            <Dropdown.Item onClick={() => createFolderHandler()}>
                                                                Create folder
                                                            </Dropdown.Item>
                                                        )}
                                                        <Dropdown.Item onClick={() => createLocalFolderHandler()}>
                                                            Create archive folder
                                                        </Dropdown.Item>
                                                    </SimpleBar>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        )}

                                        {/* {isLocalFolderView && (
                                            <>
                                                <Dropdown.Divider />
                                                <Dropdown.Item
                                                    as="button"
                                                    type="button"
                                                    disabled={isExportingEml || resolveSelectedMessageIds().length === 0}
                                                    onClick={() => void handleExportEml()}
                                                >
                                                    {isExportingEml ? 'Exporting…' : 'Export as EML'}
                                                </Dropdown.Item>
                                            </>
                                        )} */}
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

                    {/* Arrange by uses scroll load-more — hide prev/next. On mobile/tablet with an open email, swipe navigates instead. */}
                    {hasEmails && !arrangeBy && (isDesktop || !activeEmailMessageId) && (
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