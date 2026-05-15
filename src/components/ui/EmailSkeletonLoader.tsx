const EmailSkeletonLoader = ({ count = 10 }: { count?: number }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <tr key={index} className="skeleton-email-row">
                    <td>
                        <div className="skeleton-div">
                            <div className="d-flex align-items-start">
                                <div className="skeleton-checkbox"></div>
                                <div className="w-100">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="skeleton-email-sender" style={{ width: '200px' }}></div>
                                        <div className="skeleton-email-date" style={{ width: '60px' }}></div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="skeleton-email-subject" style={{ width: '150px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
};

export default EmailSkeletonLoader;
