interface UserCellProps {
    data: any;
}

const UserCell = ({ data }: UserCellProps) => {
    const firstLetter = (data?.name || '').charAt(0).toUpperCase();

    return (
        <div className="user-details-data-table">
            <div className="d-flex align-items-center profile-section">
                <span className="mail-profile-label ms-0">{firstLetter}</span>

                <div className="d-block">
                    <span className="mail-profile-name d-block">
                        {data?.name}
                    </span>
                    <span className="mail-profile-id d-block">
                        {data?.email}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UserCell;
