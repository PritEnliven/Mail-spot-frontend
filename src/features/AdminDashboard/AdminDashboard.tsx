import ActionCell from '@components/ui/AdminDashboard/ActionCell';
import StatusCell from "@components/ui/AdminDashboard/StatusCell";
import UserCell from '@components/ui/AdminDashboard/UserCell';
import Select2Wrapper, { type SingleOption } from '@components/ui/form/Select2Wrapper';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useAdmin } from "@context/AdminDataContext";
import { useAdminUI } from "@context/AdminUIContext";
import { useScreen } from "@context/ScreenContext";
import { pageStyles, usePageStylesheet } from '@hooks/usePageStyleSheet';
import chevronLeftIconBig from "@images/chevron-left-icon-big.svg";
import chevronRightIconBig from "@images/chevron-right-icon-big.svg";
import searchIcon from "@images/search-icon.svg";
import { adminGetUserList, deleteUser, getAdminSettings, loginAdminAsUser } from '@services/adminService/adminService';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

ModuleRegistry.registerModules([AllCommunityModule]);

const firstDefined = (source: any, keys: string[]) => {
    for (const key of keys) {
        const value = source?.[key] ?? source?.settings?.[key];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
};

const asFlag = (value: unknown): boolean | null => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'enabled', 'on'].includes(normalized)) return true;
        if (['false', '0', 'no', 'disabled', 'off'].includes(normalized)) return false;
    }
    return null;
};

const formatFlag = (value: boolean | null) => (value === null ? '—' : value ? 'Yes' : 'No');

const withUserSettings = (user: any, settings?: any) => {
    const source = settings ? { ...user, ...settings } : user;
    return {
        ...user,
        fileSize: firstDefined(source, ['fileSize', 'file_size']),
        sendToOutsideDomain: firstDefined(source, ['sendToOutsideDomain', 'sentOutside', 'sendOutside']),
        receiveFromOutsideDomain: firstDefined(source, ['receiveFromOutsideDomain', 'receiveOutside', 'receivedOutside']),
        aiFeatures: firstDefined(source, ['aiFeatures', 'enableAiFeatures', 'aiFeaturesEnabled']),
    };
};

const userSettingsArePresent = (user: any) =>
    user?.fileSize !== undefined
    && user?.sendToOutsideDomain !== undefined
    && user?.receiveFromOutsideDomain !== undefined
    && user?.aiFeatures !== undefined;

const PAGE_SIZE_OPTIONS: SingleOption[] = [
    // { label: "2", value: "2" },
    { label: "10", value: "10" },
    { label: "25", value: "25" },
    { label: "50", value: "50" },
    { label: "100", value: "100" },
];

const AdminDashboard = () => {
    usePageStylesheet([pageStyles.agGridCss, pageStyles.agGridCustomCss, pageStyles.agGridThemeAlpineCss])
    const navigate = useNavigate();
    const { isMobile } = useScreen();
    const [rowData, setRowData] = useState<any[]>([]);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0].value);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [goToPage, setGoToPage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const gridRef = useRef<AgGridReact>(null);
    const usersRequestRef = useRef(0);
    const { openModal } = useAdminUI();
    const { setSettingPayLoad, setAdminBoxTitle } = useAdmin();

    const pageSizeNum = Number(pageSize) || 10;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSizeNum) || 1);

    const fetchUsers = useCallback(async (page: number, limit: number) => {
        const requestId = ++usersRequestRef.current;
        setIsLoading(true);
        try {
            const response = await adminGetUserList({ page, limit });
            const users = Array.isArray(response?.data) ? response.data : [];
            const total = Number(response?.total ?? response?.totalCount ?? users.length) || 0;
            const normalized = users.map((user: any) => withUserSettings(user));
            const withSettings = await Promise.all(normalized.map(async (user: any) => {
                if (userSettingsArePresent(user) || !user?.id) return user;
                const settingsResponse = await getAdminSettings({
                    isAdmin: false,
                    userId: user.id,
                    role: 'user',
                });
                if (settingsResponse?.statusCode !== 200) return user;
                return withUserSettings(user, settingsResponse.data);
            }));

            if (requestId !== usersRequestRef.current) return;

            setRowData(withSettings);
            setTotalRows(total);

            // If current page is past the last page after a size/delete change, clamp it
            const maxPage = Math.max(1, Math.ceil(total / limit) || 1);
            if (page > maxPage) {
                setCurrentPage(maxPage);
            }
        } catch (err) {
            if (requestId !== usersRequestRef.current) return;
            console.error('Failed to load users', err);
            setRowData([]);
            setTotalRows(0);
        } finally {
            if (requestId === usersRequestRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchUsers(currentPage, pageSizeNum);
    }, [currentPage, pageSizeNum, fetchUsers]);

    const colDefs = [
        {
            headerName: 'No.',
            sortable: false,
            minWidth: 67,
            maxWidth: 67,
            flex: 0,
            getQuickFilterText: () => '',
            valueGetter: (params: any) => {
                const sourceIndex = params.node?.sourceRowIndex;
                const index =
                    typeof sourceIndex === 'number' && sourceIndex >= 0
                        ? sourceIndex
                        : (params.node?.rowIndex ?? 0);
                return (currentPage - 1) * pageSizeNum + index + 1;
            },
        },
        {
            headerName: 'User',
            flex: 2,
            sortable: false,
            minWidth: 340,
            cellRenderer: UserCell,
            getQuickFilterText: (params: any) => {
                const name = params.data?.name ?? '';
                const email = params.data?.email ?? '';
                return `${name} ${email}`;
            },
        },
        {
            minWidth: 150,
            flex: 1,
            headerName: 'Domain',
            field: 'domain',
            sortable: true
        },
        {
            headerName: 'Size (MB)',
            field: 'size',
            sortable: true,
            minWidth: 100,
            flex: 1,
        },
        {
            headerName: 'Allowed file size',
            sortable: true,
            minWidth: 160,
            flex: 1,
            valueGetter: (params: any) => {
                const value = params.data?.fileSize;
                if (value === undefined || value === null || value === '') return null;
                const size = Number(value);
                return Number.isNaN(size) ? null : size;
            },
            valueFormatter: (params: any) =>
                params.value === null || params.value === undefined ? '—' : `${params.value} MB`,
        },
        {
            headerName: 'Sent outside domain',
            sortable: true,
            minWidth: 180,
            flex: 1,
            valueGetter: (params: any) => asFlag(params.data?.sendToOutsideDomain),
            valueFormatter: (params: any) => formatFlag(params.value),
        },
        {
            headerName: 'Receive outside domain',
            sortable: true,
            minWidth: 200,
            flex: 1,
            valueGetter: (params: any) => asFlag(params.data?.receiveFromOutsideDomain),
            valueFormatter: (params: any) => formatFlag(params.value),
        },
        {
            headerName: 'Enable AI-powered features',
            sortable: true,
            minWidth: 220,
            flex: 1,
            valueGetter: (params: any) => asFlag(params.data?.aiFeatures),
            valueFormatter: (params: any) => formatFlag(params.value),
        },
        {
            headerName: 'Status',
            field: 'status',
            sortable: true,
            minWidth: 120,
            flex: 1,
            cellRenderer: StatusCell
        },
        {
            headerName: 'Actions',
            sortable: false,
            minWidth: 100,
            maxWidth: 150,
            flex: 0,
            cellRenderer: (params: any) => (
                <ActionCell
                    id={params.data.id}
                    onClickChangePassword={handleChangePassword}
                    onClickEditUser={handleEditUser}
                    onClickDeleteUser={handleDeleteUser}
                    onClickLoginAsUser={handleLoginAsUser}
                />
            )
        }
    ];

    const handleChangePassword = (userId: string) => {
        openModal('changePassword', {
            userId
        });
    };

    const handleEditUser = async (userId: string) => {
        try {
            const user = rowData.find((row) => row.id === userId);
            const userLabel = (user?.name || user?.email || '').trim();
            setSettingPayLoad({
                userId,
                role: "user",
                isAdmin: false
            });
            setAdminBoxTitle(
                userLabel ? `User Management (${userLabel})` : 'User Management'
            );
            navigate('/admin/settings');        
        } catch (error) {
            console.error('Error fetching user settings:', error);
            showError("An error occurred while fetching user settings");
        }
    };                                              

    const handleDeleteUser = (userId: string) => {
        openModal('deleteConfirmation', {
            onConfirm: async () => {
                const response = await deleteUser(userId);
                if (response.statusCode === 200) {
                    showSuccess('User deleted successfully');
                    // Refetch so page totals stay in sync with the server
                    const nextTotal = Math.max(0, totalRows - 1);     
                    const maxPage = Math.max(1, Math.ceil(nextTotal / pageSizeNum) || 1);
                    if (currentPage > maxPage) {
                        setCurrentPage(maxPage);
                    } 
                    else {
                        await fetchUsers(currentPage, pageSizeNum);
                    }
                } else {
                    showError(response.message || 'Failed to delete user');
                    throw new Error(response.message);
                }
            }
        });
    };

    const handleLoginAsUser = async (userId: string) => {
        const response = await loginAdminAsUser({ userId });
        if (response.statusCode === 200) {
            const { token, email, username, id } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('email', email);
            localStorage.setItem('username', username);
            localStorage.setItem('id', id);

            window.open('/mail/INBOX', '_blank');
        } else {
            showError(
                response.message ||
                response.data?.message ||
                "Failed to login as user"
            );
        }
    };

    const defaultColDef = {
        flex: 1,
        sortable: true,
        resizable: false,
        unSortIcon: true
    };

    const goToPrevPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const goToNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    const handleGoToPage = () => {
        if (!goToPage) return;
        const pageNumber = parseInt(goToPage, 10);
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            setGoToPage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleGoToPage();
        }
    };

    const handlePageSizeChange = (value: string | null) => {
        if (!value) return;
        setPageSize(value);
        setCurrentPage(1);
    };

    const rangeStart = totalRows === 0 ? 0 : (currentPage - 1) * pageSizeNum + 1;
    const rangeEnd = Math.min(currentPage * pageSizeNum, totalRows);

    const paginationControls = (
        <div className="d-flex align-items-center justify-content-between pt-3 admin-pagination-row">
            <div className="go-to-sec d-flex align-items-center">
                <div className="form-group m-0 me-2">
                    <input
                        type="number"
                        className="form-control"
                        id="goToPageInput"
                        placeholder="Page"
                        min={1}
                        max={totalPages}
                        value={goToPage}
                        onChange={(e) => setGoToPage(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button
                    id="goToPageBtn"
                    className="btn-new"
                    onClick={handleGoToPage}
                    disabled={!goToPage || parseInt(goToPage, 10) < 1 || parseInt(goToPage, 10) > totalPages || isLoading}
                >
                    Go
                </button>
            </div>
            <div className="pagination-box d-flex align-items-center">
                <div className="d-flex align-items-center pagination-btn-box">
                    <button
                        className="btn hover-link icon-hover-effect"
                        id="prevPage"
                        data-bs-title="Previous"
                        disabled={currentPage <= 1 || isLoading}
                        onClick={goToPrevPage}
                    >
                        <img className="hover-image" src={chevronLeftIconBig} alt="Previous" />
                    </button>
                    <button
                        className="btn hover-link icon-hover-effect"
                        id="nextPage"
                        data-bs-title="Next"
                        disabled={currentPage >= totalPages || totalPages === 0 || isLoading}
                        onClick={goToNextPage}
                    >
                        <img className="hover-image" src={chevronRightIconBig} alt="Next" />
                    </button>
                </div>
                <ul className="pagination-cus">
                    <li className="pagination-count">
                        <span id="currentPageRange" className="email-count">
                            {rangeStart} - {rangeEnd}
                        </span>
                        <span className="of"> of </span>
                        <span id="totalRecordsCount" className="total-email-count">
                            {totalRows}
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className={`admin-data-tabl-box ${isMobile ? 'admin-data-tabl-box--mobile' : ''}`}>
            <div className="Tool-bar-box d-flex align-items-center justify-content-between mb-3">
                <div className="top-search">
                    <div className="input-icon-add">
                        <div className="form-group input-big t-search-group inbox-more mb-0">
                            <img
                                src={searchIcon}
                                alt=""
                                data-bs-toggle="tooltip"
                                data-bs-placement="Left"
                                data-bs-custom-class="custom-tooltip"
                                data-bs-title="Search"
                            />
                            <input
                                type="search"
                                className="form-control dropdown-toggle navTopSearchDropdown-cm"
                                placeholder="Search..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="d-flex align-items-center admin-page-size">
                    <div className="form-group m-0">
                        <div className="input-control" style={{ width: "68px" }}>
                            <Select2Wrapper
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                options={PAGE_SIZE_OPTIONS}
                                placeholder="Select one"
                                isMulti={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {!isLoading && rowData.length === 0 ? (
                <div className="admin-data-grid-empty text-center py-5">
                    No users found
                </div>
            ) : (
                <>
                    <div
                        className="ag-theme-alpine admin-data-grid"
                        style={{ width: '100%', height: isMobile ? 'calc(100dvh - 220px)' : '500px' }}
                    >
                        <AgGridReact
                            ref={gridRef}
                            rowData={rowData}
                            columnDefs={colDefs}
                            defaultColDef={defaultColDef}
                            pagination={false}
                            headerHeight={26}
                            rowHeight={42}
                            quickFilterText={searchText}
                            suppressNoRowsOverlay={isLoading}
                            onGridReady={() => {
                                const viewport: any = document.querySelector('.ag-center-cols-viewport');
                                if (viewport) {
                                    viewport.style.height = '100%';
                                    viewport.style.width = '100%';
                                }
                            }}
                        />
                    </div>
                    {paginationControls}
                </>
            )}
        </div>
    );
}

export default AdminDashboard;
