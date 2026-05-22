const CountSkeleton = ({ isTotal = false }: { isTotal?: boolean }) => {
    const style = isTotal ? { width: '40px', height: '14px' } : {};
    return (
        <div className={`skeleton-icon ${isTotal ? 'skeleton-icon-total' : ''}`} style={style}></div>
    );
};

export default CountSkeleton;