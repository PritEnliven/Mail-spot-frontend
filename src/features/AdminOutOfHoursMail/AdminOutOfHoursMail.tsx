import Select2Wrapper, { type SingleOption } from '@components/ui/form/Select2Wrapper';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import { useScreen } from '@context/ScreenContext';
import chevronLeftIconBig from '@images/chevron-left-icon-big.svg';
import chevronRightIconBig from '@images/chevron-right-icon-big.svg';
import searchIcon from '@images/search-icon.svg';
import viewIcon from '@images/view-icon.svg';
import viewIconHover from '@images/view-icon-hover.svg';
import {
    adminGetOutOfHoursMail,
    adminGetUserList,
    type OutOfHoursMailType,
} from '@services/adminService/adminService';
import { useEffect, useMemo, useRef, useState } from 'react';
import OutOfHoursMailDialog, { type OutOfHoursMailPreview } from './OutOfHoursMailDialog';

const MAIL_PAGE_SIZE_OPTIONS: SingleOption[] = [
    { label: '10', value: '10' },
    { label: '25', value: '25' },
    { label: '50', value: '50' },
    { label: '100', value: '100' },
];

const USER_PAGE_LIMIT = 50;
const SEARCH_DELAY_MS = 400;
const EMPTY_MAIL_MESSAGE = 'No out-of-hours emails found.';
const NOT_CONFIGURED_MESSAGE = 'Standard hours are not configured for this user.';

interface OutOfHoursUser {
    id: string;
    name: string;
    email: string;
    domain: string;
    initial: string;
    status: 'active' | 'inactive';
    timeZone: string;
    hasStandardHours: boolean;
}

type OutOfHoursMessage = OutOfHoursMailPreview;

const apiErrorMessage = (response: any, fallback: string): string =>
    response?.data?.error
    || response?.data?.message
    || response?.message
    || response?.error
    || fallback;

const normalizeUser = (raw: any): OutOfHoursUser | null => {
    const id = typeof raw?.id === 'string' ? raw.id.trim() : '';
    if (!id) return null;
    const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
    const email = typeof raw?.email === 'string' ? raw.email.trim() : '';
    const initialSource = typeof raw?.initial === 'string' ? raw.initial.trim() : '';
    return {
        id,
        name: name || email || 'User',
        email,
        domain: typeof raw?.domain === 'string' ? raw.domain.trim() : '',
        initial: (initialSource || name || email || 'U').charAt(0).toUpperCase(),
        status: raw?.status === 'inactive' ? 'inactive' : 'active',
        timeZone: typeof raw?.timeZone === 'string' ? raw.timeZone.trim() : '',
        hasStandardHours: Boolean(raw?.hasStandardHours ?? raw?.standardHours?.enabled),
    };
};

const reasonLabel = (reason: string): string => {
    const normalized = reason.trim().toLowerCase();
    if (normalized === 'outside_window') return 'Outside window';
    if (normalized === 'non_working_day') return 'Non-working day';
    if (!normalized) return '—';
    return reason.replace(/_/g, ' ');
};

const normalizeEmail = (raw: any, index: number): OutOfHoursMessage => {
    const boxName = Array.isArray(raw?.boxName)
        ? raw.boxName.filter((name: unknown): name is string => typeof name === 'string' && name.trim() !== '')
        : [];
    return {
        id: typeof raw?.id === 'string' && raw.id.trim() ? raw.id : `out-of-hours-${index}`,
        from: typeof raw?.from === 'string' ? raw.from : '',
        to: typeof raw?.to === 'string' ? raw.to : '',
        cc: typeof raw?.cc === 'string' ? raw.cc : '',
        bcc: typeof raw?.bcc === 'string' ? raw.bcc : '',
        subject: typeof raw?.subject === 'string' ? raw.subject : '',
        date: typeof raw?.date === 'string' && raw.date ? raw.date : null,
        sentAt: typeof raw?.sentAt === 'string' && raw.sentAt ? raw.sentAt : null,
        direction: typeof raw?.direction === 'string' ? raw.direction : '',
        boxName,
        localTime: typeof raw?.localTime === 'string' ? raw.localTime : '',
        weekday: Number.isInteger(raw?.weekday) ? raw.weekday : null,
        weekdayName: typeof raw?.weekdayName === 'string' ? raw.weekdayName : '',
        reason: typeof raw?.reason === 'string' ? raw.reason : '',
        body: typeof raw?.body === 'string' ? raw.body : (typeof raw?.html === 'string' ? raw.html : ''),
        bodyText: typeof raw?.bodyText === 'string' ? raw.bodyText : (typeof raw?.text === 'string' ? raw.text : ''),
    };
};

const displayDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const rangeLabel = (page: number, limit: number, total: number): string => {
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}–${end} of ${total}`;
};

const AdminOutOfHoursMail = () => {
    const { isDesktop } = useScreen();
    const [users, setUsers] = useState<OutOfHoursUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [userQuery, setUserQuery] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userTotal, setUserTotal] = useState(0);
    const userQueryRef = useRef(userQuery);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [detailUser, setDetailUser] = useState<OutOfHoursUser | null>(null);
    // Mirrors mailbox isMailListOpen: on ≤992, hide users list while a user's emails are open.
    const [isUserListOpen, setIsUserListOpen] = useState(true);
    const [direction, setDirection] = useState<OutOfHoursMailType>('sent');
    const [emails, setEmails] = useState<OutOfHoursMessage[]>([]);
    const [emailsLoading, setEmailsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [configured, setConfigured] = useState(true);
    const [configMessage, setConfigMessage] = useState('');
    const [mailSearch, setMailSearch] = useState('');
    const [mailQuery, setMailQuery] = useState('');
    const [pageSize, setPageSize] = useState(MAIL_PAGE_SIZE_OPTIONS[1].value);
    const [mailPage, setMailPage] = useState(1);
    const [mailTotal, setMailTotal] = useState(0);
    const [openEmail, setOpenEmail] = useState<OutOfHoursMessage | null>(null);
    const mailQueryRef = useRef(mailQuery);

    userQueryRef.current = userQuery;
    mailQueryRef.current = mailQuery;

    const pageSizeNum = Number(pageSize) || 25;
    const userTotalPages = Math.max(1, Math.ceil(userTotal / USER_PAGE_LIMIT) || 1);
    const mailTotalPages = Math.max(1, Math.ceil(mailTotal / pageSizeNum) || 1);

    const filteredUsers = useMemo(() => {
        const query = userQuery.trim().toLowerCase();
        if (!query) return users;
        return users.filter((user) =>
            user.name.toLowerCase().includes(query)
            || user.email.toLowerCase().includes(query)
            || user.domain.toLowerCase().includes(query),
        );
    }, [users, userQuery]);

    useEffect(() => {
        const handle = setTimeout(() => {
            const next = userSearch.trim();
            if (userQueryRef.current === next) return;
            setUserPage(1);
            setUserQuery(next);
        }, SEARCH_DELAY_MS);
        return () => clearTimeout(handle);
    }, [userSearch]);

    useEffect(() => {
        const handle = setTimeout(() => {
            const next = mailSearch.trim();
            if (mailQueryRef.current === next) return;
            setMailPage(1);
            setMailQuery(next);
        }, SEARCH_DELAY_MS);
        return () => clearTimeout(handle);
    }, [mailSearch]);

    useEffect(() => {
        let cancelled = false;

        const loadUsers = async () => {
            setUsersLoading(true);
            setUsersError('');
            try {
                const response = await adminGetUserList({
                    page: userPage,
                    limit: USER_PAGE_LIMIT,
                    standardHoursEnabled: true,
                });
                if (cancelled) return;

                if (response?.statusCode && response.statusCode !== 200) {
                    setUsers([]);
                    setUserTotal(0);
                    setUsersError(apiErrorMessage(response, 'Users could not be loaded.'));
                    return;
                }

                const list = Array.isArray(response?.data) ? response.data : [];
                const nextUsers = list
                    .map(normalizeUser)
                    .filter((user: OutOfHoursUser | null): user is OutOfHoursUser => user !== null);
                const total = Number(response?.total ?? response?.totalCount ?? nextUsers.length) || 0;
                setUsers(nextUsers);
                setUserTotal(total);

                const maxPage = Math.max(1, Math.ceil(total / USER_PAGE_LIMIT) || 1);
                if (userPage > maxPage) setUserPage(maxPage);
            } catch (error) {
                console.error('Failed to load out-of-hours users', error);
                if (!cancelled) {
                    setUsers([]);
                    setUserTotal(0);
                    setUsersError('Users could not be loaded.');
                }
            } finally {
                if (!cancelled) setUsersLoading(false);
            }
        };

        loadUsers();
        return () => {
            cancelled = true;
        };
    }, [userPage]);

    useEffect(() => {
        if (!selectedUserId) {
            setEmails([]);
            setMailTotal(0);
            setEmailError('');
            setConfigured(true);
            setConfigMessage('');
            setEmailsLoading(false);
            return;
        }

        let cancelled = false;

        const loadEmails = async () => {
            setEmailsLoading(true);
            setEmailError('');
            try {
                const response = await adminGetOutOfHoursMail({
                    userId: selectedUserId,
                    type: direction,
                    search: mailQuery,
                    page: mailPage,
                    limit: pageSizeNum,
                });

                if (cancelled) return;

                if (response?.statusCode && response.statusCode !== 200) {
                    setEmails([]);
                    setMailTotal(0);
                    setConfigured(true);
                    setConfigMessage('');
                    setEmailError(apiErrorMessage(response, 'Out-of-hours emails could not be loaded.'));
                    return;
                }

                const payload = response?.data ?? {};
                const nextUser = normalizeUser(payload.user);
                if (nextUser && nextUser.id === selectedUserId) {
                    setDetailUser((current) => ({
                        ...(current && current.id === nextUser.id ? current : nextUser),
                        ...nextUser,
                    }));
                }

                const isConfigured = payload.configured !== false;
                setConfigured(isConfigured);
                setConfigMessage(
                    typeof payload.message === 'string' && payload.message.trim()
                        ? payload.message.trim()
                        : (isConfigured ? '' : NOT_CONFIGURED_MESSAGE),
                );

                const nextEmails = (Array.isArray(payload.emails) ? payload.emails : [])
                    .map(normalizeEmail);
                const total = Number(payload.total ?? nextEmails.length) || 0;
                setEmails(nextEmails);
                setMailTotal(total);

                const maxPage = Math.max(1, Math.ceil(total / pageSizeNum) || 1);
                if (mailPage > maxPage) setMailPage(maxPage);
            } catch (error) {
                console.error('Failed to load out-of-hours mail', error);
                if (!cancelled) {
                    setEmails([]);
                    setMailTotal(0);
                    setConfigured(true);
                    setConfigMessage('');
                    setEmailError('Out-of-hours emails could not be loaded.');
                }
            } finally {
                if (!cancelled) setEmailsLoading(false);
            }
        };

        loadEmails();
        return () => {
            cancelled = true;
        };
    }, [selectedUserId, direction, mailQuery, mailPage, pageSizeNum]);

    // Keep email detail visible when shrinking past 992 with a user selected (mailbox-style).
    useEffect(() => {
        if (!isDesktop && selectedUserId) {
            setIsUserListOpen(false);
        }
        if (isDesktop) {
            setIsUserListOpen(true);
        }
    }, [isDesktop, selectedUserId]);

    const selectUser = (user: OutOfHoursUser) => {
        if (user.id !== selectedUserId) {
            setSelectedUserId(user.id);
            setDetailUser(user);
            setDirection('sent');
            setMailSearch('');
            setMailQuery('');
            setMailPage(1);
            setEmails([]);
            setMailTotal(0);
            setEmailError('');
            setConfigured(true);
            setConfigMessage('');
        }
        if (!isDesktop) setIsUserListOpen(false);
    };

    const changeDirection = (next: OutOfHoursMailType) => {
        if (next === direction) return;
        setDirection(next);
        setMailPage(1);
    };

    const handlePageSizeChange = (value: string | null) => {
        if (!value || value === pageSize) return;
        setPageSize(value);
        setMailPage(1);
    };

    const emptyCopy = !configured
        ? (configMessage || NOT_CONFIGURED_MESSAGE)
        : (mailQuery ? 'No emails match this search.' : EMPTY_MAIL_MESSAGE);

    const colSpan = 5;
    const isDetailOpen = !isDesktop && !isUserListOpen && !!selectedUserId;

    return (
        <div className={`admin-outside-mail ${isDetailOpen ? 'admin-outside-mail--detail' : ''}`}>
            <aside className="admin-outside-mail__users">
                <div className="admin-outside-mail__user-search">
                    <img src={searchIcon} alt="" />
                    <input
                        type="search"
                        className="form-control"
                        placeholder="Search users"
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                    />
                </div>
                <div className="admin-outside-mail__user-list">
                    {usersLoading ? (
                        <p className="admin-outside-mail__empty">Loading users…</p>
                    ) : usersError ? (
                        <p className="admin-outside-mail__empty">{usersError}</p>
                    ) : filteredUsers.length === 0 ? (
                        <p className="admin-outside-mail__empty">No users found</p>
                    ) : (
                        filteredUsers.map((user) => {
                            const isActive = user.id === selectedUserId;
                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={`admin-outside-user ${isActive ? 'active' : ''}`}
                                    onClick={() => selectUser(user)}
                                >
                                    <span className="mail-profile-label">{user.initial}</span>
                                    <span className="admin-outside-user__text">
                                        <span className="mail-received-name">{user.name}</span>
                                        <span className="mail-received-subject">{user.email}</span>
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
                {userTotal > USER_PAGE_LIMIT && (
                    <div className="admin-outside-mail__user-pager">
                        <button
                            type="button"
                            className="btn hover-link icon-hover-effect"
                            disabled={userPage <= 1 || usersLoading}
                            onClick={() => setUserPage((page) => Math.max(1, page - 1))}
                        >
                            <img src={chevronLeftIconBig} alt="Previous users" />
                        </button>
                        <span>{rangeLabel(userPage, USER_PAGE_LIMIT, userTotal)}</span>
                        <button
                            type="button"
                            className="btn hover-link icon-hover-effect"
                            disabled={userPage >= userTotalPages || usersLoading}
                            onClick={() => setUserPage((page) => Math.min(userTotalPages, page + 1))}
                        >
                            <img src={chevronRightIconBig} alt="Next users" />
                        </button>
                    </div>
                )}
            </aside>

            <section className="admin-outside-mail__detail">
                {!isDesktop && (
                    <button
                        type="button"
                        className="admin-outside-mail__back"
                        onClick={() => setIsUserListOpen(true)}
                    >
                        <img src={chevronLeftIconBig} alt="" />
                        Users
                    </button>
                )}

                {!detailUser ? (
                    <p className="admin-outside-mail__empty admin-outside-mail__empty--panel">
                        Select a user to see emails sent or received outside their standard hours.
                    </p>
                ) : (
                    <>
                        <div className="admin-outside-mail__toolbar">
                            <div className="admin-outside-mail__tabs" role="tablist" aria-label="Out-of-hours mail">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={direction === 'sent'}
                                    className={`admin-outside-mail__tab ${direction === 'sent' ? 'active' : ''}`}
                                    onClick={() => changeDirection('sent')}
                                >
                                    Sent
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={direction === 'received'}
                                    className={`admin-outside-mail__tab ${direction === 'received' ? 'active' : ''}`}
                                    onClick={() => changeDirection('received')}
                                >
                                    Received
                                </button>
                            </div>
                            <div className="admin-outside-mail__toolbar-end">
                                <div className="admin-outside-mail__email-search">
                                    <img src={searchIcon} alt="" />
                                    <input
                                        type="search"
                                        className="form-control"
                                        placeholder="Search this page"
                                        value={mailSearch}
                                        onChange={(event) => setMailSearch(event.target.value)}
                                    />
                                </div>
                                <div className="admin-page-size">
                                    <div className="input-control" style={{ width: '68px' }}>
                                        <Select2Wrapper
                                            value={pageSize}
                                            onChange={handlePageSizeChange}
                                            options={MAIL_PAGE_SIZE_OPTIONS}
                                            placeholder="25"
                                            isMulti={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="admin-outside-mail__table-scroll">
                            <table className="admin-outside-table">
                                <thead>
                                    <tr>
                                        {direction === 'received' && (
                                            <th><span className="admin-outside-table__head-label">Sender</span></th>
                                        )}
                                        {direction === 'sent' && (
                                            <th><span className="admin-outside-table__head-label">Receiver</span></th>
                                        )}
                                        <th><span className="admin-outside-table__head-label">Subject</span></th>
                                        <th><span className="admin-outside-table__head-label">Reason</span></th>
                                        <th><span className="admin-outside-table__head-label">Date</span></th>
                                        <th className="view">
                                            <span className="admin-outside-table__head-label">View</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emailsLoading ? (
                                        <tr>
                                            <td colSpan={colSpan} className="admin-outside-table__status">Loading emails…</td>
                                        </tr>
                                    ) : emailError ? (
                                        <tr>
                                            <td colSpan={colSpan} className="admin-outside-table__status">{emailError}</td>
                                        </tr>
                                    ) : emails.length === 0 ? (
                                        <tr>
                                            <td colSpan={colSpan} className="admin-outside-table__status">{emptyCopy}</td>
                                        </tr>
                                    ) : (
                                        emails.map((email) => {
                                            const address = direction === 'sent' ? email.to : email.from;
                                            return (
                                                <tr key={email.id}>
                                                    <td className="is-external" title={address}>
                                                        {address || '—'}
                                                    </td>
                                                    <td className="subject" title={email.subject}>{email.subject || '—'}</td>
                                                    <td className="domain">
                                                        <span className="admin-outside-domain">{reasonLabel(email.reason)}</span>
                                                    </td>
                                                    <td className="date">{displayDate(email.date)}</td>
                                                    <td className="view">
                                                        <button
                                                            type="button"
                                                            className="btn hover-link icon-hover-effect admin-outside-view-btn"
                                                            aria-label="View email"
                                                            onClick={() => setOpenEmail(email)}
                                                        >
                                                            <InteractiveIcon
                                                                defaultIcon={viewIcon}
                                                                hoverIcon={viewIconHover}
                                                                activeIcon=""
                                                                isActive={false}
                                                                alt=""
                                                                className="interactive-icon hover-image"
                                                                renderAs="img"
                                                                tooltip="View email"
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex align-items-center justify-content-end pt-3 admin-pagination-row">
                            <div className="pagination-box d-flex align-items-center">
                                <div className="d-flex align-items-center pagination-btn-box">
                                    <button
                                        type="button"
                                        className="btn hover-link icon-hover-effect"
                                        disabled={mailPage <= 1 || emailsLoading}
                                        onClick={() => setMailPage((page) => Math.max(1, page - 1))}
                                    >
                                        <img className="hover-image" src={chevronLeftIconBig} alt="Previous" />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn hover-link icon-hover-effect"
                                        disabled={mailPage >= mailTotalPages || mailTotal === 0 || emailsLoading}
                                        onClick={() => setMailPage((page) => Math.min(mailTotalPages, page + 1))}
                                    >
                                        <img className="hover-image" src={chevronRightIconBig} alt="Next" />
                                    </button>
                                </div>
                                <ul className="pagination-cus">
                                    <li className="pagination-count">
                                        <span className="email-count">{rangeLabel(mailPage, pageSizeNum, mailTotal)}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}
            </section>
            {openEmail && selectedUserId && (
                <OutOfHoursMailDialog
                    userId={selectedUserId}
                    email={openEmail}
                    onClose={() => setOpenEmail(null)}
                />
            )}
        </div>
    );
};

export default AdminOutOfHoursMail;
