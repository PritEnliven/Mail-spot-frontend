import InteractiveIcon from '@components/ui/InteractiveIcon';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import ContactList, { ContactEmptyState } from '@features/contacts/ContactList';
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
import type { Contact } from '@models/Contact';
import { deleteContact } from '@services/contact/contactService';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useMailData } from '@context/MailDataContext';
import { useMailUI } from '@context/MailUIContext';
import { useContacts } from '@context/ContactsContext';
import { useScreen } from '@context/ScreenContext';
import { useEffect, useMemo, useState } from 'react';

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

    const {
        contacts,
        page,
        limit,
        total,
        totalPages,
        rangeStart,
        rangeEnd,
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
    const debouncedSearch = useDebounce(searchInput, 300);
    const visiblePages = useMemo(
        () => getVisiblePages(page, totalPages),
        [page, totalPages],
    );

    useEffect(() => {
        setBoxName('contact');
        setBoxTitle('Contacts');
    }, [setBoxName, setBoxTitle]);

    useEffect(() => {
        setSearchQuery(debouncedSearch.trim());
        setPage(1);
    }, [debouncedSearch, setSearchQuery, setPage]);

    useEffect(() => {
        const handleRefresh = () => {
            refresh();
        };
        window.addEventListener(CONTACTS_LIST_REFRESH_EVENT, handleRefresh);
        return () => {
            window.removeEventListener(CONTACTS_LIST_REFRESH_EVENT, handleRefresh);
        };
    }, [refresh]);

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
            onConfirm: async () => {
                const response = await deleteContact(contact._id);
                if (response?.statusCode === 200) {
                    showSuccess('Contact deleted successfully');
                    refresh();
                    void fetchContacts();
                } else {
                    showError(response?.message || 'Failed to delete contact');
                }
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
    const showToolbar = showSearch || !isMobile;

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
                    {!isMobile && (
                        <div className="contacts-toolbar-actions">
                            {showSearch && !isMobilebig && (
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
                            {showSearch && (
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
                            {isMobilebig ? (
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
                            )}
                        </div>
                    )}
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
                                />
                            </div>
                        ) : (
                            <div className={`contacts-table${(!isLoading && contacts.length === 0) ? ' is-empty' : ''}`}>
                                <table className="table">
                                    <thead>
                                        <tr>
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
                                                <div className="contacts-th-head">Birthdate</div>
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
