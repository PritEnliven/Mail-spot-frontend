import InteractiveIcon from '@components/ui/InteractiveIcon';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import ContactList, { ContactEmptyState } from '@features/contacts/ContactList';
import ContactsExportMenu from '@features/contacts/ContactsExportMenu';
import {
    CONTACT_PAGE_LIMIT_OPTIONS,
    CONTACTS_LIST_REFRESH_EVENT,
    useContactsList,
} from '@features/contacts/useContacts';
import { pageStyles, usePageStylesheet } from '@hooks/usePageStyleSheet';
import { useDebounce } from '@hooks/useDebounce';
import plusIconWhite from '@images/plus-icon-white.svg';
import leftArrowPaginationIconHover from '@images/chevron-left-icon-big-hover.svg';
import leftArrowPaginationIcon from '@images/chevron-left-icon-big.svg';
import rightArrowPaginationIconHover from '@images/chevron-right-icon-big-hover.svg';
import rightArrowPaginationIcon from '@images/chevron-right-icon-big.svg';
import searchIcon from "@images/search-icon.svg";
import deleteIcon from '@images/trash-icon.svg';
import deleteIconHover from '@images/trash-icon-hover.svg';
import type { Contact } from '@models/Contact';
import { deleteContact, deleteContacts } from '@services/contact/contactService';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useMailData } from '@context/MailDataContext';
import { useMailUI } from '@context/MailUIContext';
import { useContacts } from '@context/ContactsContext';
import { useScreen } from '@context/ScreenContext';
import { useAccount } from '@context/AccountContext';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SORT_OPTIONS = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Recently updated', value: 'updatedAt' },
];

function getVisiblePages(current: number, totalPages: number): Array<number | 'ellipsis'> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (current <= 4) {
        return [1, 2, 3, 4, 'ellipsis', totalPages];
    }

    if (current >= totalPages - 3) {
        return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages];
}

function ContactsPage() {
    usePageStylesheet([pageStyles.settingsCss]);
    const { openModal } = useMailUI();
    const { fetchContacts } = useContacts();
    const { isMobilebig, isMobile } = useScreen();
    const { setBoxName, setBoxTitle } = useMailData();
    const { activeAccountId } = useAccount();

    const {
        contacts,
        page,
        limit,
        total,
        totalPages,
        rangeStart,
        rangeEnd,
        searchQuery,
        sort,
        isLoading,
        error,
        setPage,
        setLimit,
        setSearchQuery,
        setSort,
        refresh,
    } = useContactsList();

    const [searchInput, setSearchInput] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const debouncedSearch = useDebounce(searchInput, 300);
    const visiblePages = useMemo(
        () => getVisiblePages(page, totalPages),
        [page, totalPages],
    );
    const selectedIdsList = useMemo(() => Array.from(selectedIds), [selectedIds]);
    const pageContactIds = useMemo(() => contacts.map((c) => c._id), [contacts]);
    const selectedOnPageCount = useMemo(
        () => pageContactIds.filter((id) => selectedIds.has(id)).length,
        [pageContactIds, selectedIds],
    );
    const isAllPageSelected = pageContactIds.length > 0 && selectedOnPageCount === pageContactIds.length;
    const isPageIndeterminate = selectedOnPageCount > 0 && selectedOnPageCount < pageContactIds.length;

    useEffect(() => {
        setBoxName('contact');
        setBoxTitle('Contacts');
    }, [setBoxName, setBoxTitle]);

    useEffect(() => {
        setSearchQuery(debouncedSearch.trim());
        setPage(1);
    }, [debouncedSearch, setSearchQuery, setPage]);

    useEffect(() => {
        setSelectedIds(new Set());
        setSearchInput('');
    }, [activeAccountId]);

    useEffect(() => {
        const handleRefresh = () => {
            refresh();
        };
        window.addEventListener(CONTACTS_LIST_REFRESH_EVENT, handleRefresh);
        return () => {
            window.removeEventListener(CONTACTS_LIST_REFRESH_EVENT, handleRefresh);
        };
    }, [refresh]);

    const handleToggleSelect = useCallback((contactId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(contactId)) {
                next.delete(contactId);
            } else {
                next.add(contactId);
            }
            return next;
        });
    }, []);

    const handleToggleSelectAllPage = useCallback(() => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            const allSelected = pageContactIds.length > 0
                && pageContactIds.every((id) => next.has(id));
            if (allSelected) {
                pageContactIds.forEach((id) => next.delete(id));
            } else {
                pageContactIds.forEach((id) => next.add(id));
            }
            return next;
        });
    }, [pageContactIds]);

    const handleAddContact = () => {
        openModal('contactForm', {
            isEdit: false,
            onSuccess: () => {
                refresh();
                void fetchContacts();
            },
        });
    };

    const handleEditContact = (contact: Contact) => {
        openModal('contactForm', {
            isEdit: true,
            contact,
            onSuccess: () => {
                refresh();
                void fetchContacts();
            },
        });
    };

    const handleDeleteContact = (contact: Contact) => {
        openModal('confirmDelete', {
            title: 'Delete contact',
            message: `Delete “${contact.name}”? This cannot be undone.`,
            onConfirm: async () => {
                const response = await deleteContact(contact._id);
                if (response?.statusCode === 200) {
                    showSuccess('Contact deleted successfully');
                    setSelectedIds((prev) => {
                        if (!prev.has(contact._id)) return prev;
                        const next = new Set(prev);
                        next.delete(contact._id);
                        return next;
                    });
                    refresh();
                    void fetchContacts();
                } else {
                    showError(response?.message || 'Failed to delete contact');
                }
            },
        });
    };

    const handleDeleteSelected = () => {
        const ids = selectedIdsList;
        if (ids.length === 0) return;

        const count = ids.length;
        openModal('confirmDelete', {
            title: count === 1 ? 'Delete contact' : 'Delete contacts',
            message:
                count === 1
                    ? 'Delete the selected contact? This cannot be undone.'
                    : `Delete ${count} selected contacts? This cannot be undone.`,
            onConfirm: async () => {
                const result = await deleteContacts(ids);
                if (!result.success) {
                    if (!result.statusCode || result.statusCode !== 401) {
                        showError(result.message || 'Failed to delete contacts');
                    }
                    return;
                }

                showSuccess(result.message);
                setSelectedIds(new Set());
                refresh();
                void fetchContacts();
            },
        });
    };

    const handleSortChange = (value: string | null) => {
        if (!value) return;
        setSort(value as 'name' | 'email' | 'updatedAt');
        setPage(1);
    };

    const handleLimitChange = (value: string | null) => {
        if (!value) return;
        setLimit(Number(value));
    };

    const hasActiveSearch = searchInput.trim().length > 0;
    const showSearch = isLoading || total > 0 || hasActiveSearch;
    const showPagination = total > 0;
    // Keep toolbar visible so Export stays available for empty lists (incl. mobile).
    const showToolbar = true;
    const exportCompact = isMobilebig || isMobile;

    return (
        <div id="contactsContainer" className="contacts-page">
            {showToolbar && (
            <div className="pt-3 contacts-page-toolbar">
                <div className="contacts-toolbar-row">
                    {showSearch && (
                    <div className="contacts-filters-row">
                        <div className="contacts-filter-field">
                            <div className="form-group form-row mb-0">
                                <div className="input-control">
                                    <div className='input-icon-add'>
                                        <InteractiveIcon
                                            defaultIcon={searchIcon}
                                            alt=""
                                            className="input-icon-1"
                                        />
                                        <input
                                            id="contactSearch"
                                            type="search"
                                            className="form-control"
                                            placeholder="Search by name or email"
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            aria-label="Search contacts"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                    <div className="contacts-toolbar-actions">
                            {showSearch && !isMobile && !isMobilebig && (
                            <div className="contacts-filter-field contacts-sort-field">
                                <div className="form-group form-row mb-0">
                                    <div className="input-control">
                                        <Select2Wrapper
                                            value={sort}
                                            onChange={handleSortChange}
                                            options={SORT_OPTIONS}
                                            isMulti={false}
                                            typeable={false}
                                            placeholder="Sort by..."
                                        />
                                    </div>
                                </div>
                            </div>
                            )}
                            {showSearch && !isMobile && (
                            <div className="contacts-filter-field contacts-page-limit-field">
                                <div className="form-group form-row mb-0">
                                    <div className="input-control">
                                        <Select2Wrapper
                                            value={String(limit)}
                                            onChange={handleLimitChange}
                                            options={CONTACT_PAGE_LIMIT_OPTIONS}
                                            isMulti={false}
                                            typeable={false}
                                            placeholder="Limit"
                                        />
                                    </div>
                                </div>
                            </div>
                            )}
                            <ContactsExportMenu
                                compact={exportCompact}
                                searchQuery={searchQuery}
                                selectedIds={selectedIdsList}
                            />
                            <button
                                type="button"
                                className={`btn-new hover-link contacts-delete-selected-btn${exportCompact ? ' contacts-delete-selected-btn--compact' : ''}`}
                                onClick={handleDeleteSelected}
                                disabled={selectedIdsList.length === 0}
                                aria-label={
                                    selectedIdsList.length === 1
                                        ? 'Delete selected contact'
                                        : selectedIdsList.length > 1
                                            ? `Delete ${selectedIdsList.length} selected contacts`
                                            : 'Delete selected contacts'
                                }
                            >
                                <InteractiveIcon
                                    defaultIcon={deleteIcon}
                                    hoverIcon={deleteIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip={exportCompact ? 'Delete selected' : ''}
                                />
                                {!exportCompact && (
                                    <span>
                                        Delete
                                        {selectedIdsList.length > 1 ? ` (${selectedIdsList.length})` : ''}
                                    </span>
                                )}
                            </button>
                            {!isMobile && (
                                isMobilebig ? (
                                    <button
                                        type="button"
                                        className="btn-new btn-new-bg hover-link contacts-add-contact-icon-btn"
                                        onClick={handleAddContact}
                                        aria-label="Add contact"
                                    >
                                        <InteractiveIcon
                                            defaultIcon={plusIconWhite}
                                            hoverIcon={plusIconWhite}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip="Add contact"
                                        />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-new btn-new-bg hover-link contacts-add-contact-btn"
                                        onClick={handleAddContact}
                                    >
                                        <InteractiveIcon
                                            defaultIcon={plusIconWhite}
                                            hoverIcon={plusIconWhite}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip=""
                                        />
                                        <span>Add contact</span>
                                    </button>
                                )
                            )}
                        </div>
                </div>
            </div>
            )}

            {error && (
                <div className="px-3 pt-2 text-danger fs-12-commom contacts-page-error">{error}</div>
            )}

            <div className="pt-0 pb-0 pe-0 contacts-page-main">
                <div className="contacts-page-main-inner">
                    <div className="contacts-page-table-wrap">
                        {isMobilebig ? (
                            <div className="contacts-mobile-wrap">
                                <ContactList
                                    contacts={contacts}
                                    isLoading={isLoading}
                                    startIndex={rangeStart}
                                    onEdit={handleEditContact}
                                    onDelete={handleDeleteContact}
                                    layout="mobile"
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
                                />
                            </div>
                        ) : (
                            <div className={`contacts-table${(!isLoading && contacts.length === 0) ? ' is-empty' : ''}`}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th className="contacts-table__select">
                                                <div className="checkbox-custom table-check contacts-select-checkbox">
                                                    <input
                                                        className="list-child"
                                                        type="checkbox"
                                                        id="contactCheckAll"
                                                        name="contact-checkbox-all"
                                                        checked={isAllPageSelected}
                                                        disabled={isLoading || pageContactIds.length === 0}
                                                        ref={(el) => {
                                                            if (el) el.indeterminate = isPageIndeterminate;
                                                        }}
                                                        onChange={handleToggleSelectAllPage}
                                                        aria-label="Select all contacts on this page"
                                                    />
                                                    <label htmlFor="contactCheckAll" className="label-text" />
                                                </div>
                                            </th>
                                            <th>
                                                <div className="contacts-th-head">No.</div>
                                            </th>
                                            <th className="contacts-table__name">
                                                <div className="contacts-th-head">Name</div>
                                            </th>
                                            <th>
                                                <div className="contacts-th-head">Email</div>
                                            </th>
                                            <th>
                                                <div className="contacts-th-head">Phone</div>
                                            </th>
                                            <th>
                                                <div className="contacts-th-head">Address</div>
                                            </th>
                                            <th>
                                                <div className="contacts-th-head">Date of birth</div>
                                            </th>
                                            <th>
                                                <div className="contacts-th-head">Notes</div>
                                            </th>
                                            <th className="text-end">
                                                <div className="contacts-th-head">Action</div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <ContactList
                                            contacts={contacts}
                                            isLoading={isLoading}
                                            startIndex={rangeStart}
                                            onEdit={handleEditContact}
                                            onDelete={handleDeleteContact}
                                            selectedIds={selectedIds}
                                            onToggleSelect={handleToggleSelect}
                                        />
                                    </tbody>
                                </table>
                                {!isLoading && contacts.length === 0 && (
                                    <div className="contacts-empty-state-wrap">
                                        <ContactEmptyState />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showPagination && (
            <div className="contacts-page-pagination">
                <div className="contacts-pagination-summary">
                    Showing <strong>{rangeStart}</strong> to <strong>{rangeEnd}</strong> of <strong>{total}</strong> entries
                    {selectedIds.size > 0 && (
                        <> · <strong>{selectedIds.size}</strong> selected</>
                    )}
                </div>
                <div className="contacts-pagination-controls" aria-label="Contacts pagination">
                    <button
                        type="button"
                        className="contacts-pagination-arrow"
                        disabled={page <= 1 || isLoading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-label="Previous page"
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
                    {visiblePages.map((item, index) => (
                        item === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="contacts-pagination-ellipsis">
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                className={`contacts-pagination-page${page === item ? ' is-active' : ''}`}
                                disabled={isLoading}
                                onClick={() => setPage(item)}
                                aria-label={`Page ${item}`}
                                aria-current={page === item ? 'page' : undefined}
                            >
                                {item}
                            </button>
                        )
                    ))}
                    <button
                        type="button"
                        className="contacts-pagination-arrow"
                        disabled={page >= totalPages || isLoading}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        aria-label="Next page"
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
                <div className="contacts-pagination-spacer" aria-hidden="true" />
            </div>
            )}
        </div>
    );
}

export default ContactsPage;
