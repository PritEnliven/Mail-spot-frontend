import ActionCell from '@components/ui/AdminDashboard/ActionCell';
import StatusCell from "@components/ui/AdminDashboard/StatusCell";
import UserCell from '@components/ui/AdminDashboard/UserCell';
import Select2Wrapper, { type SingleOption } from '@components/ui/form/Select2Wrapper';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useAdmin } from "@context/AdminDataContext";
import { useAdminUI } from "@context/AdminUIContext";
import { pageStyles, usePageStylesheet } from '@hooks/usePageStyleSheet';
import chevronLeftIconBig from "@images/chevron-left-icon-big.svg";
import chevronRightIconBig from "@images/chevron-right-icon-big.svg";
import searchIcon from "@images/search-icon.svg";
import { adminGetUserList, deleteUser, loginAdminAsUser } from '@services/adminService/adminService';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

const PAGE_SIZE_OPTIONS: SingleOption[] = [
    { label: "10", value: "10" },
    { label: "25", value: "25" },
    { label: "50", value: "50" },
    { label: "100", value: "100" },
];

const AdminDashboard = () => {
    usePageStylesheet([pageStyles.agGridCss, pageStyles.agGridCustomCss, pageStyles.agGridThemeAlpineCss])
    const navigate = useNavigate();
    const [rowData, setRowData] = useState<any[]>([]);
    const [gridApi, setGridApi] = useState<any>(null);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0].value);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [goToPage, setGoToPage] = useState('');
    const gridRef = useRef<AgGridReact>(null);
    const { openModal } = useAdminUI();
    const { setSettingPayLoad } = useAdmin();

    // Clear leftover user session once on mount only — do not clear after login-as-user
    useEffect(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('id');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await adminGetUserList();
                setRowData(response.data ?? []);
            } catch (err) {
                console.error('Failed to load users', err);
            }
        };

        fetchUsers();
    }, [pageSize]);


    const colDefs = [
        {
            headerName: 'No.',
            sortable: true,
            minWidth: 67,
            maxWidth: 67,
            flex: 0,
            valueGetter: (params: any) => params.node.rowIndex + 1,
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

    // Action handlers
    const handleChangePassword = (userId: string) => {
        openModal('changePassword', {
            userId
        });
    };

    const handleEditUser = async (userId: string) => {
        try {
            setSettingPayLoad({
                userId,
                role: "user",
                isAdmin: false
            });
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
                    setRowData(prev => prev.filter(user => user.id !== userId));
                    showSuccess('User deleted successfully');
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

            // Match Login.tsx AUTH_STORAGE_KEYS so ProtectedRoute + mail APIs work
            localStorage.setItem('token', token);
            localStorage.setItem('email', email);
            localStorage.setItem('username', username);
            localStorage.setItem('id', id);

            showSuccess("Logged in as user successfully");
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

    // Pagination
    const goToPrevPage = () => {
        gridRef.current?.api.paginationGoToPreviousPage();
    };

    const goToNextPage = () => {
        gridRef.current?.api.paginationGoToNextPage();
    };

    const handleGoToPage = () => {
        if (!goToPage || !gridRef.current) return;

        const pageNumber = parseInt(goToPage, 10);
        const maxPage = gridRef.current.api.paginationGetTotalPages();

        if (pageNumber >= 1 && pageNumber <= maxPage) {
            gridRef.current.api.paginationGoToPage(pageNumber - 1); // AG Grid uses 0-based index
            setGoToPage(''); // Clear the input after navigation
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleGoToPage();
        }
    };

    return (
        <div className="admin-data-tabl-box">
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
                <div className="d-flex align-items-center">
                    <div className="form-group m-0 me-2">
                        <div className="input-control" style={{ width: "68px" }}>
                            <Select2Wrapper
                                value={pageSize}
                                onChange={(option: any) => {
                                    setPageSize(option);
                                }}
                                options={PAGE_SIZE_OPTIONS}
                                placeholder="Select one"
                                isMulti={false}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {rowData.length === 0 ? (
                <div className="admin-data-grid-empty text-center py-5">
                    No users found
                </div>
            ) : (
                <>
                    <div className="ag-theme-alpine admin-data-grid" style={{ width: '100%', height: '500px' }}>
                        <AgGridReact
                            ref={gridRef}
                            rowData={rowData}
                            columnDefs={colDefs}
                            defaultColDef={defaultColDef}
                            pagination
                            paginationPageSize={Number(pageSize)}
                            headerHeight={26}
                            rowHeight={42}
                            quickFilterText={searchText}
                            onGridReady={(params) => {
                                setGridApi(params.api);
                                setTotalRows(params.api.getDisplayedRowCount());
                                // Set viewport height after grid is ready
                                const viewport: any = document.querySelector('.ag-center-cols-viewport');
                                if (viewport) {
                                    viewport.style.height = '100%';
                                    viewport.style.width = '100%';
                                }
                            }}
                            onPaginationChanged={() => {
                                if (!gridApi) return
                                setCurrentPage(gridApi.paginationGetCurrentPage() + 1);
                                setTotalPages(gridApi.paginationGetTotalPages());
                                setTotalRows(gridApi.getDisplayedRowCount());
                            }}
                        />
                    </div>
                    <div className="d-flex align-items-center justify-content-between pt-3">
                        <div className="pagination-box d-flex align-items-center">
                            <div className="d-flex align-items-center pagination-btn-box">
                                <button
                                    className="btn hover-link icon-hover-effect"
                                    id="prevPage"
                                    data-bs-title="Previous"
                                    disabled={currentPage <= 1}
                                    onClick={goToPrevPage}
                                >
                                    <img className="hover-image" src={chevronLeftIconBig} alt="Previous" />
                                </button>
                                <button
                                    className="btn hover-link icon-hover-effect"
                                    id="nextPage"
                                    data-bs-title="Next"
                                    disabled={currentPage >= totalPages || totalPages === 0}
                                    onClick={goToNextPage}
                                >
                                    <img className="hover-image" src={chevronRightIconBig} alt="Next" />
                                </button>
                            </div>
                            <ul className="pagination-cus me-3">
                                <li className="pagination-count">
                                    <span id="currentPageRange" className="email-count">
                                        {(currentPage - 1) * Number(pageSize) + 1} - {Math.min(currentPage * Number(pageSize), totalRows)}
                                    </span>
                                    <span className="of"> of </span>
                                    <span id="totalRecordsCount" className="total-email-count">
                                        {totalRows}
                                    </span>
                                </li>
                            </ul>
                        </div>
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
                                disabled={!goToPage || parseInt(goToPage, 10) < 1 || parseInt(goToPage, 10) > totalPages}
                            >
                                Go
                            </button>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}

export default AdminDashboard;