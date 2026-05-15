interface StatusCellProps {
    value: string;
}

const StatusCell = ({ value }: StatusCellProps) => {
    const isActive = (value || '').toLowerCase() === 'active';

    return (
        <div className={`Default-label ${isActive ? 'active-label' : 'inactive-label'}`}>
            <span className={`Default-label-dot ${isActive ? 'active-dot' : 'inactive-dot'}`} />
            <span>{isActive ? 'Active' : 'Inactive'}</span>
        </div>
    );
};

export default StatusCell;
