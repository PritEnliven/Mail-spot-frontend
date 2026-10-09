import InteractiveIcon from '@components/ui/InteractiveIcon';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import ContactList, { ContactEmptyState } from '@features/contacts/ContactList';
import ContactsExportMenu from '@features/contacts/ContactsExportMenu';
import GroupList, { GroupEmptyState } from '@features/contacts/GroupList';
import {
    CONTACT_PAGE_LIMIT_OPTIONS,
    CONTACTS_LIST_REFRESH_EVENT,
    useContactsList,
} from '@features/contacts/useContacts';
import {
    CONTACT_GROUP_PAGE_LIMIT_OPTIONS,
    CONTACT_GROUPS_LIST_REFRESH_EVENT,
    useContactGroupsList,
} from '@features/contacts/useContactGroups';
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
import type { Contact, ContactGroup, ContactGroupSortField } from '@models/Contact';
import {
    deleteContact,
    deleteContactGroup,
    deleteContactGroups,
    deleteContacts,
} from '@services/contact/contactService';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useMailData } from '@context/MailDataContext';
import { useMailUI } from '@context/MailUIContext';
import { useContacts } from '@context/ContactsContext';
import { useScreen } from '@context/ScreenContext';
import { useAccount } from '@context/AccountContext';
import { useCallback, useEffect, useMemo, useState } from 'react';

const CONTACT_SORT_OPTIONS = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Recently updated', value: 'updatedAt' },
];

const GROUP_SORT_OPTIONS = [
    { label: 'Name', value: 'name' },
    { label: 'Members', value: 'memberCount' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Recently updated', value: 'updatedAt' },
];

type ContactsViewTab = 'contacts' | 'groups';

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

    const [searchInput, setSearchInput] = useState('');
    const [activeView, setActiveView] = useState<ContactsViewTab>('contacts');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const debouncedSearch = useDebounce(searchInput, 300);
    const isContactsView = activeView === 'contacts';
    const isGroupsView = activeView === 'groups';

    const contactsList = useContactsList();
    const groupsList = useContactGroupsList(isGroupsView);

    const {
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
    } = isGroupsView ? groupsList : contactsList;

    const visiblePages = useMemo(
        () => getVisiblePages(page, totalPages),
        [page, totalPages],
    );
    const selectedIdsList = useMemo(() => Array.from(selectedIds), [selectedIds]);
    const pageItemIds = useMemo(
        () => (isGroupsView
            ? groupsList.groups.map((g) => g._id)
            : contactsList.contacts.map((c) => c._id)),
        [contactsList.contacts, groupsList.groups, isGroupsView],
    );
    const selectedOnPageCount = useMemo(
        () => pageItemIds.filter((id) => selectedIds.has(id)).length,
        [pageItemIds, selectedIds],
    );
    const isAllPageSelected = pageItemIds.length > 0 && selectedOnPageCount === pageItemIds.length;
    const isPageIndeterminate = selectedOnPageCount > 0 && selectedOnPageCount < pageItemIds.length;

    useEffect(() => {
        setBoxName('contact');
        setBoxTitle(isGroupsView ? 'Groups' : 'Contacts');
    }, [isGroupsView, setBoxName, setBoxTitle]);

    useEffect(() => {
        setSearchQuery(debouncedSearch.trim());
        setPage(1);
    }, [debouncedSearch, setSearchQuery, setPage]);

    useEffect(() => {
        setSelectedIds(new Set());
        setSearchInput('');
        setActiveView('contacts');
    }, [activeAccountId]);

    useEffect(() => {
        const handleContactsRefresh = () => {
            contactsList.refresh();
        };
        const handleGroupsRefresh = () => {
            groupsList.refresh();
        };
        window.addEventListener(CONTACTS_LIST_REFRESH_EVENT, handleContactsRefresh);
        window.addEventListener(CONTACT_GROUPS_LIST_REFRESH_EVENT, handleGroupsRefresh);
        return () => {
            window.removeEventListener(CONTACTS_LIST_REFRESH_EVENT, handleContactsRefresh);
            window.removeEventListener(CONTACT_GROUPS_LIST_REFRESH_EVENT, handleGroupsRefresh);
        };
    }, [contactsList.refresh, groupsList.refresh]);

    const handleViewChange = (view: ContactsViewTab) => {
        if (view === activeView) return;
        setActiveView(view);
        setSearchInput('');
        setSelectedIds(new Set());
        if (view === 'contacts') {
            contactsList.setSearchQuery('');
            contactsList.setPage(1);
        } else {
            groupsList.setSearchQuery('');
            groupsList.setPage(1);
        }
    };

    const handleToggleSelect = useCallback((itemId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    }, []);

    const handleToggleSelectAllPage = useCallback(() => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            const allSelected = pageItemIds.length > 0
                && pageItemIds.every((id) => next.has(id));
            if (allSelected) {
                pageItemIds.forEach((id) => next.delete(id));
            } else {
                pageItemIds.forEach((id) => next.add(id));
            }
            return next;
        });
    }, [pageItemIds]);

    const handleAddContact = () => {
        openModal('contactForm', {
            isEdit: false,
            onSuccess: () => {
                contactsList.refresh();
                void fetchContacts();
            },
        });
    };

    const refreshGroups = () => {
        groupsList.refresh();
        window.dispatchEvent(new CustomEvent(CONTACT_GROUPS_LIST_REFRESH_EVENT));
    };

    const handleCreateGroup = () => {
        openModal('createGroup', {
            onSuccess: refreshGroups,
        });
    };

    const handleEditGroup = (group: ContactGroup) => {
        openModal('createGroup', {
            isEdit: true,
            groupId: group._id,
            groupName: group.name,
            onSuccess: (updated?: ContactGroup) => {
                if (updated?._id) {
                    groupsList.updateGroup(updated);
                    return;
                }
                refreshGroups();
            },
        });
    };

    const handleOpenGroup = (group: ContactGroup) => {
        openModal('groupDetail', {
            groupId: group._id,
            groupName: group.name,
            onDeleted: () => {
                setSelectedIds((prev) => {
                    if (!prev.has(group._id)) return prev;
                    const next = new Set(prev);
                    next.delete(group._id);
                    return next;
                });
                refreshGroups();
            },
            onUpdated: (updated?: ContactGroup) => {
                if (updated?._id) {
                    groupsList.updateGroup(updated);
                    return;
                }
                refreshGroups();
            },
        });
    };

    const handleEditContact = (contact: Contact) => {
        openModal('contactForm', {
            isEdit: true,
            contact,
            onSuccess: (updated?: Contact) => {
                if (updated?._id) {
                    contactsList.updateContact(updated);
                    void fetchContacts();
                    return;
                }
                contactsList.refresh();
                void fetchContacts();
            },
        });
    };

    const handleDeleteContact = (contact: Contact) => {
        openModal('confirmDelete', {
            title: 'Delete contact',
            message: `Delete “${contact.name}”?`,
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
                    contactsList.refresh();
                    void fetchContacts();
                } else {
                    showError(response?.message || 'Failed to delete contact');
                }
            },
        });
    };

    const handleDeleteGroup = (group: ContactGroup) => {
        openModal('confirmDelete', {
            title: 'Delete group',
            message: `Delete “${group.name}”?`,
            onConfirm: async () => {
                const response = await deleteContactGroup(group._id);
                if (response?.statusCode === 200) {
                    showSuccess(response?.message || 'Group deleted successfully');
                    setSelectedIds((prev) => {
                        if (!prev.has(group._id)) return prev;
                        const next = new Set(prev);
                        next.delete(group._id);
                        return next;
                    });
                    refreshGroups();
                } else {
                    showError(response?.message || 'Failed to delete group');
                }
            },
        });
    };

    const handleDeleteSelected = () => {
        const ids = selectedIdsList;
        if (ids.length === 0) return;

        const count = ids.length;

        if (isGroupsView) {
            openModal('confirmDelete', {
                title: count === 1 ? 'Delete group' : 'Delete groups',
                message:
                    count === 1
                        ? 'Delete the selected group?'
                        : `Delete ${count} selected groups?`,
                onConfirm: async () => {
                    const result = await deleteContactGroups(ids);
                    if (!result.success) {
                        if (!result.statusCode || result.statusCode !== 401) {
                            showError(result.message || 'Failed to delete groups');
                        }
                        return;
                    }

                    showSuccess(result.message);
                    setSelectedIds(new Set());
                    groupsList.refresh();
                },
            });
            return;
        }

        openModal('confirmDelete', {
            title: count === 1 ? 'Delete contact' : 'Delete contacts',
            message:
                count === 1
                    ? 'Delete the selected contact?'
                    : `Delete ${count} selected contacts?`,
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
                contactsList.refresh();
                void fetchContacts();
            },
        });
    };

    const handleSortChange = (value: string | null) => {
        if (!value) return;
        if (isGroupsView) {
            groupsList.setSort(value as ContactGroupSortField);
            groupsList.setPage(1);
            return;
        }
        contactsList.setSort(value as 'name' | 'email' | 'updatedAt');
        contactsList.setPage(1);
    };

    const handleLimitChange = (value: string | null) => {
        if (!value) return;
        setLimit(Number(value));
    };

    const hasActiveSearch = searchInput.trim().length > 0;
    const showSearch = isLoading || total > 0 || hasActiveSearch;
    const showPagination = total > 0;
    const showToolbar = true;
    const sortOptions = isGroupsView ? GROUP_SORT_OPTIONS : CONTACT_SORT_OPTIONS;
    const limitOptions = isGroupsView
        ? CONTACT_GROUP_PAGE_LIMIT_OPTIONS
        : CONTACT_PAGE_LIMIT_OPTIONS;

    return (
        <div id="contactsContainer" className="contacts-page">
            {showToolbar && (
            <div className="pt-3 contacts-page-toolbar">
                <div className="contacts-toolbar-row">
                    <div className="contacts-toolbar-left">
                        <div className="contacts-view-tabs" role="tablist" aria-label="Contacts views">
                            <button
                                type="button"
                                role="tab"
                                id="contacts-view-tab-contacts"
                                aria-selected={isContactsView}
                                aria-controls="contacts-view-panel"
                                className={`contacts-view-tab${isContactsView ? ' is-active' : ''}`}
                                onClick={() => handleViewChange('contacts')}
                            >
                                Contacts
                            </button>
                            <button
                                type="button"
                                role="tab"
                                id="contacts-view-tab-groups"
                                aria-selected={isGroupsView}
                                aria-controls="contacts-view-panel"
                                className={`contacts-view-tab${isGroupsView ? ' is-active' : ''}`}
                                onClick={() => handleViewChange('groups')}
                            >
                                Groups
                            </button>
                        </div>
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
                                                placeholder={
                                                    isGroupsView
                                                        ? 'Search groups'
                                                        : 'Search by name or email'
                                                }
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                aria-label={isGroupsView ? 'Search groups' : 'Search contacts'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                    <div className="contacts-toolbar-actions">
                            {showSearch && !isMobile && !isMobilebig && (
                            <div className="contacts-filter-field contacts-sort-field">
                                <div className="form-group form-row mb-0">
                                    <div className="input-control">
                                        <Select2Wrapper
                                            value={sort}
                                            onChange={handleSortChange}
                                            options={sortOptions}
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
                                            options={limitOptions}
                                            isMulti={false}
                                            typeable={false}
                                            placeholder="Limit"
                                        />
                                    </div>
                                </div>
                            </div>
                            )}
                            {isContactsView && (
                            <ContactsExportMenu
                                compact
                                searchQuery={searchQuery}
                                selectedIds={selectedIdsList}
                            />
                            )}
                            <button
                                type="button"
                                className="btn-new hover-link contacts-delete-selected-btn contacts-delete-selected-btn--compact"
                                onClick={handleDeleteSelected}
                                disabled={selectedIdsList.length === 0}
                                aria-label={
                                    isGroupsView
                                        ? selectedIdsList.length === 1
                                            ? 'Delete selected group'
                                            : selectedIdsList.length > 1
                                                ? `Delete ${selectedIdsList.length} selected groups`
                                                : 'Delete selected groups'
                                        : selectedIdsList.length === 1
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
                                    tooltip={
                                        selectedIdsList.length > 0
                                            ? isGroupsView
                                                ? `Delete ${selectedIdsList.length} selected ${selectedIdsList.length === 1 ? 'group' : 'groups'}`
                                                : `Delete ${selectedIdsList.length} selected ${selectedIdsList.length === 1 ? 'contact' : 'contacts'}`
                                            : 'Delete selected'
                                    }
                                />
                                {selectedIdsList.length > 0 && (
                                    <span className="contacts-delete-selected-count">
                                        ({selectedIdsList.length})
                                    </span>
                                )}
                            </button>
                            {!isMobile && isContactsView && (
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
                            {!isMobile && isGroupsView && (
                                isMobilebig ? (
                                    <button
                                        type="button"
                                        className="btn-new btn-new-bg hover-link contacts-add-contact-icon-btn"
                                        onClick={handleCreateGroup}
                                        aria-label="Create group"
                                    >
                                        <InteractiveIcon
                                            defaultIcon={plusIconWhite}
                                            hoverIcon={plusIconWhite}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip="Create group"
                                        />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-new btn-new-bg hover-link contacts-add-contact-btn"
                                        onClick={handleCreateGroup}
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
                                        <span>Create group</span>
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

            <div
                className="pt-0 pb-0 pe-0 contacts-page-main"
                id="contacts-view-panel"
                role="tabpanel"
                aria-labelledby={
                    isGroupsView ? 'contacts-view-tab-groups' : 'contacts-view-tab-contacts'
                }
            >
                <div className="contacts-page-main-inner">
                    <div className="contacts-page-table-wrap">
                        {isGroupsView ? (
                            isMobilebig ? (
                                <div className="contacts-mobile-wrap">
                                    <GroupList
                                        groups={groupsList.groups}
                                        isLoading={isLoading}
                                        startIndex={rangeStart}
                                        onOpen={handleOpenGroup}
                                        onEdit={handleEditGroup}
                                        onDelete={handleDeleteGroup}
                                        layout="mobile"
                                        selectedIds={selectedIds}
                                        onToggleSelect={handleToggleSelect}
                                    />
                                </div>
                            ) : (
                                <div className={`contacts-table${(!isLoading && groupsList.groups.length === 0) ? ' is-empty' : ''}`}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th className="contacts-table__select">
                                                    <div className="checkbox-custom table-check contacts-select-checkbox">
                                                        <input
                                                            className="list-child"
                                                            type="checkbox"
                                                            id="groupCheckAll"
                                                            name="group-checkbox-all"
                                                            checked={isAllPageSelected}
                                                            disabled={isLoading || pageItemIds.length === 0}
                                                            ref={(el) => {
                                                                if (el) el.indeterminate = isPageIndeterminate;
                                                            }}
                                                            onChange={handleToggleSelectAllPage}
                                                            aria-label="Select all groups on this page"
                                                        />
                                                        <label htmlFor="groupCheckAll" className="label-text" />
                                                    </div>
                                                </th>
                                                <th>
                                                    <div className="contacts-th-head">No.</div>
                                                </th>
                                                <th className="contacts-table__name">
                                                    <div className="contacts-th-head">Name</div>
                                                </th>
                                                <th>
                                                    <div className="contacts-th-head">Members</div>
                                                </th>
                                                <th className="text-end">
                                                    <div className="contacts-th-head">Action</div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <GroupList
                                                groups={groupsList.groups}
                                                isLoading={isLoading}
                                                startIndex={rangeStart}
                                                onOpen={handleOpenGroup}
                                                onEdit={handleEditGroup}
                                                onDelete={handleDeleteGroup}
                                                selectedIds={selectedIds}
                                                onToggleSelect={handleToggleSelect}
                                            />
                                        </tbody>
                                    </table>
                                    {!isLoading && groupsList.groups.length === 0 && (
                                        <div className="contacts-empty-state-wrap">
                                            <GroupEmptyState />
                                        </div>
                                    )}
                                </div>
                            )
                        ) : isMobilebig ? (
                            <div className="contacts-mobile-wrap">
                                <ContactList
                                    contacts={contactsList.contacts}
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
                            <div className={`contacts-table${(!isLoading && contactsList.contacts.length === 0) ? ' is-empty' : ''}`}>
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
                                                        disabled={isLoading || pageItemIds.length === 0}
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
                                            contacts={contactsList.contacts}
                                            isLoading={isLoading}
                                            startIndex={rangeStart}
                                            onEdit={handleEditContact}
                                            onDelete={handleDeleteContact}
                                            selectedIds={selectedIds}
                                            onToggleSelect={handleToggleSelect}
                                        />
                                    </tbody>
                                </table>
                                {!isLoading && contactsList.contacts.length === 0 && (
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
                    Showing <strong>{rangeStart}</strong> to <strong>{rangeEnd}</strong> of <strong>{total}</strong>{' '}
                    {isGroupsView
                        ? (total === 1 ? 'group' : 'groups')
                        : (total === 1 ? 'contact' : 'contacts')}
                    {selectedIds.size > 0 && (
                        <> · <strong>{selectedIds.size}</strong> selected</>
                    )}
                </div>
                <div
                    className="contacts-pagination-controls"
                    aria-label={isGroupsView ? 'Groups pagination' : 'Contacts pagination'}
                >
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
