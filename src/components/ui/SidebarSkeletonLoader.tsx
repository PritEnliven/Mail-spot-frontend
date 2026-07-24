const SidebarSkeletonLoader = ({ count = 5 }: { count?: number }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <li key={index} className="m-item skeleton-item">
                    <a href="#" className="m-link">
                        <div className="d-flex align-items-center">
                            <div className="skeleton-text"></div>
                            <div className="skeleton-icon"></div>
                        </div>
                    </a>
                </li>
            ))}
        </>
    );
};

export default SidebarSkeletonLoader;
