import ActionCell from '@components/ui/AdminDashboard/ActionCell';
import StatusCell from '@components/ui/AdminDashboard/StatusCell';

interface AdminUserCardProps {
    user: {
        id: string;
        name?: string;
        email?: string;
        domain?: string;
        size?: number | string;
        status?: string;
        hasStandardHours?: boolean;
    };
    onClickChangePassword: (id: string) => void;
    onClickStandardHours: (id: string) => void;
    onClickEditUser: (id: string) => void;
    onClickDeleteUser: (id: string) => void;
    onClickLoginAsUser: (id: string) => void;
}

const AdminUserCard = ({
    user,
    onClickChangePassword,
    onClickStandardHours,
    onClickEditUser,
    onClickDeleteUser,
    onClickLoginAsUser,
}: AdminUserCardProps) => {
    const firstLetter = (user?.name || '').charAt(0).toUpperCase() || 'U';

    return (
        <article className="admin-user-card">
            <div className="admin-user-card__top">
                <div className="admin-user-card__identity">
                    <span className="mail-profile-label ms-0">{firstLetter}</span>
                    <div>
                        <h2 className="admin-user-card__name">{user.name}</h2>
                        <p className="admin-user-card__email">{user.email}</p>
                    </div>
                </div>
                <StatusCell value={user.status || ''} />
            </div>

            <div className="admin-user-card__meta">
                <div>
                    <span className="admin-user-card__meta-label">Domain</span>
                    <span className="admin-user-card__meta-value">{user.domain}</span>
                </div>
                <div>
                    <span className="admin-user-card__meta-label">Size (MB)</span>
                    <span className="admin-user-card__meta-value">{user.size}</span>
                </div>
                <div>
                    <span className="admin-user-card__meta-label">Standard hours</span>
                    <span className="admin-user-card__meta-value">
                        {user.hasStandardHours ? 'Yes' : 'No'}
                    </span>
                </div>
            </div>

            <div className="admin-user-card__actions">
                <ActionCell
                    id={user.id}
                    onClickChangePassword={onClickChangePassword}
                    onClickStandardHours={onClickStandardHours}
                    onClickEditUser={onClickEditUser}
                    onClickDeleteUser={onClickDeleteUser}
                    onClickLoginAsUser={onClickLoginAsUser}
                />
            </div>
        </article>
    );
};

export default AdminUserCard;
