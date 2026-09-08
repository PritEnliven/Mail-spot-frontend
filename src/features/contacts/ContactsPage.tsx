import InteractiveIcon from '@components/ui/InteractiveIcon';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import ContactList from '@features/contacts/ContactList';
import { useContactsList } from '@features/contacts/useContacts';
import { pageStyles, usePageStylesheet } from '@hooks/usePageStyleSheet';
import { useDebounce } from '@hooks/useDebounce';
import plusIconWhite from '@images/plus-icon-white.svg';
import leftArrowPaginationIconHover from '@images/chevron-left-icon-big-hover.svg';
import leftArrowPaginationIcon from '@images/chevron-left-icon-big.svg';
import rightArrowPaginationIconHover from '@images/chevron-right-icon-big-hover.svg';
import rightArrowPaginationIcon from '@images/chevron-right-icon-big.svg';
import type { Contact } from '@models/Contact';
// import { searchAndFilterEmailService } from '@services/email/emailService';
import { deleteContact } from '@services/contact/contactService';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useMailData } from '@context/MailDataContext';
import { useMailUI } from '@context/MailUIContext';
import { useContacts } from '@context/ContactsContext';
// import { buildSearchFilterPayload } from '@utils/filterUtil';
import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';

const SORT_OPTIONS = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Recently updated', value: 'updatedAt' },
];

function ContactsPage() {
    usePageStylesheet([pageStyles.settingsCss]);
    // const navigate = useNavigate();
    const { openModal } = useMailUI();
    const { fetchContacts } = useContacts();
    const {
        setBoxName,
        setBoxTitle,
        // setEmails,
        // setPagination,
        // setSearchTerm,
        // setFilterForm,
        // setAllSearchResult,
        // setMailListPage,
        // setTotalEmailBadge,
    } = useMailData();

    const {
        contacts,
        page,
        total,
        totalPages,
        rangeStart,
        rangeEnd,
        searchQuery,
        sort,
        isLoading,
        error,
        setPage,
        setSearchQuery,
        setSort,
        refresh,
    } = useContactsList();

    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 300);

    useEffect(() => {
        setBoxName('contact');
        setBoxTitle('Contacts');
    }, [setBoxName, setBoxTitle]);

    useEffect(() => {
        setSearchQuery(debouncedSearch.trim());
        setPage(1);
    }, [debouncedSearch, setSearchQuery, setPage]);

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

    // const handleCompose = (contact: Contact) => {
    //     void fetchContacts();
    //     openModal('compose', {
    //         emailData: {
    //             _id: '',
    //             to: [contact.email],
    //             cc: [],
    //             bcc: [],
    //         },
    //     });
    // };

    // const handleViewEmails = async (contact: Contact) => {
    //     navigate('/mail/INBOX');
    //     setBoxName('INBOX');
    //     setAllSearchResult(true);
    //     setSearchTerm(contact.email);
    //     setFilterForm(null);
    //     setMailListPage(1);

    //     try {
    //         const response = await searchAndFilterEmailService(
    //             buildSearchFilterPayload({
    //                 searchText: contact.email,
    //                 filterForm: null,
    //                 limit: 25,
    //                 direction: 'next',
    //                 vPage: 1,
    //             }),
    //         );

    //         if (response?.statusCode === 200) {
    //             setEmails(response.data.emailList || []);
    //             setPagination(response.data.pagination);
    //             setBoxTitle('Search Results');
    //             setTotalEmailBadge(response.data.pagination?.totalEmails ?? 0);
    //         } else {
    //             showError(response?.message || 'Failed to search emails');
    //         }
    //     } catch {
    //         showError('Failed to search emails');
    //     }
    // };

    const handleSortChange = (value: string | null) => {
        if (!value) return;
        setSort(value as 'name' | 'email' | 'updatedAt');
        setPage(1);
    };

    return (
        <div id="contactsContainer" className="settings-container setting-main-section-left">
            <div className="single-header blue-line-aft d-flex align-items-center justify-content-between">
                <h2 className="box-title mb-0">Contacts</h2>
                <button type="button" className="btn-new btn-new-bg hover-link" onClick={handleAddContact}>
                    <InteractiveIcon
                        defaultIcon={plusIconWhite}
                        hoverIcon={plusIconWhite}
                        activeIcon=""
                        isActive={false}
                        alt=""
                        className="interactive-icon hover-image me-2"
                        renderAs="img"
                        tooltip=""
                    />
                    Add contact
                </button>
            </div>

            <div className="setting-features setting-features-select-2 pt-3">
                <div className="row m-0 g-3 align-items-end">
                    <div className="col-lg-6 col-md-8">
                        <div className="form-group form-row mb-0">
                            <label className="control-label" htmlFor="contactSearch">Search</label>
                            <div className="input-control">
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
                    <div className="col-lg-3 col-md-4">
                        <div className="form-group form-row mb-0">
                            <label className="control-label">Sort by</label>
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
                </div>
            </div>

            {error && (
                <div className="px-3 pt-2 text-danger fs-12-commom">{error}</div>
            )}

            <div className="setting-features pt-0 pb-0 pe-0">
                <div className="setting-features-sub-box">
                    <div className="setting-signature-box">
                        <div className="signature-table-new">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>
                                            <div className="setting-th-head">No.</div>
                                        </th>
                                        <th className="name-size">
                                            <div className="setting-th-head">Name</div>
                                        </th>
                                        <th>
                                            <div className="setting-th-head">Email</div>
                                        </th>
                                        <th>
                                            <div className="setting-th-head">Phone</div>
                                        </th>
                                        <th className="text-end">
                                            <div className="setting-th-head">Action</div>
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
                                        // onCompose={handleCompose}
                                        // onViewEmails={handleViewEmails}
                                    />
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex align-items-center justify-content-between pt-3 px-3 pb-3">
                            <div className="pagination-box d-flex align-items-center">
                                <div className="d-flex align-items-center pagination-btn-box">
                                    <button
                                        type="button"
                                        className="btn hover-link icon-hover-effect"
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
                                    <button
                                        type="button"
                                        className="btn hover-link icon-hover-effect"
                                        disabled={page >= totalPages || total === 0 || isLoading}
                                        onClick={() => setPage((p) => p + 1)}
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
                                <ul className="pagination-cus me-3 mb-0">
                                    <li className="pagination-count">
                                        <span className="email-count">{rangeStart} - {rangeEnd}</span>
                                        <span className="of"> of </span>
                                        <span className="total-email-count">{total}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactsPage;
