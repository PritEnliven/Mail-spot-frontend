const EmailDetailSkeletonLoader = ({ attachmentCount = 3 }: { attachmentCount?: number }) => {
    return (
        <div className="skeleton-email-detail">
            <div className="email-detail-section">
                {/* Header: subject + reply/forward icons */}
                <div className="mail-details-header d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <div className="skeleton-div skeleton-email-subject" style={{ width: '320px', height: '20px' }}></div>
                    </div>
                </div>

                {/* From / To / timestamp block */}
                <div className="mail-message-send--information-details-box">
                    <div className="d-block">
                        {/* From row */}
                        <div className="mail-details-information-details-box d-flex align-items-start justify-content-between">
                            <div className="d-flex align-items-center profile-section">
                                <div className="skeleton-div skeleton-avatar-circle"></div>
                                <div className="d-block ms-2">
                                    <div className="skeleton-div skeleton-email-sender" style={{ width: '120px', height: '14px', marginBottom: '6px' }}></div>
                                    <div className="skeleton-div skeleton-email-sender" style={{ width: '180px', height: '12px' }}></div>
                                </div>
                            </div>
                            <div className="skeleton-div skeleton-email-date" style={{ width: '140px', height: '12px' }}></div>
                        </div>

                        {/* To row */}
                        <div className="mail-details-information-details-box d-flex align-items-start mt-2">
                            <div className="skeleton-div skeleton-email-sender" style={{ width: '40px', height: '12px' }}></div>
                            <div className="skeleton-div skeleton-email-sender ms-3" style={{ width: '220px', height: '12px' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body content */}
            <div className="mail-content-details-box">
                <div className="skeleton-div skeleton-body-line" style={{ width: '40%', height: '18px', marginBottom: '14px' }}></div>
                <div className="skeleton-div skeleton-body-line" style={{ width: '90%', height: '12px', marginBottom: '8px' }}></div>
                <div className="skeleton-div skeleton-body-line" style={{ width: '85%', height: '12px', marginBottom: '8px' }}></div>
                <div className="skeleton-div skeleton-body-line" style={{ width: '70%', height: '12px', marginBottom: '8px' }}></div>
                <div className="skeleton-div skeleton-body-line" style={{ width: '60%', height: '12px' }}></div>
            </div>

            {/* Attachments */}
            <div className="application-attachments-box no-border">
                <div className="d-flex align-items-center justify-content-between application-attachments-header">
                    <div className="skeleton-div skeleton-body-line" style={{ width: '140px', height: '14px' }}></div>
                    <div className="skeleton-div skeleton-icon-circle"></div>
                </div>
                <div className="attachments-pdf-box-main d-flex align-items-start flex-wrap">
                    {Array.from({ length: attachmentCount }).map((_, index) => (
                        <div className="attachments-pdf-box" key={index}>
                            <div className="skeleton-div skeleton-attachment-thumb"></div>
                            <div className="skeleton-div skeleton-body-line mt-2" style={{ width: '100px', height: '10px' }}></div>
                            <div className="skeleton-div skeleton-body-line mt-1" style={{ width: '60px', height: '10px' }}></div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .skeleton-email-detail {
                    width: 100%;
                    height: 100%;
                    padding: 20px 24px;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                }

                .skeleton-email-detail .skeleton-div {
                    background: linear-gradient(90deg, #edeef0 25%, #f6f7f8 37%, #edeef0 63%);
                    background-size: 400% 100%;
                    animation: skeleton-shimmer 1.4s ease infinite;
                    border-radius: 4px;
                }

                @keyframes skeleton-shimmer {
                    0% { background-position: 100% 50%; }
                    100% { background-position: 0 50%; }
                }

                .skeleton-email-detail .email-detail-section {
                    padding-bottom: 16px;
                    border-bottom: 1px solid #eef0f2;
                    margin-bottom: 20px;
                }

                .skeleton-email-detail .mail-details-header {
                    margin-bottom: 20px;
                }

                .skeleton-email-detail .application-btn-multi ul {
                    display: flex;
                    align-items: center;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    gap: 8px;
                }

                .skeleton-email-detail .mail-message-send--information-details-box {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .skeleton-email-detail .mail-details-information-details-box {
                    display: flex;
                    align-items: center;
                    width: 100%;
                }

                .skeleton-email-detail .profile-section {
                    display: flex;
                    align-items: center;
                }

                .skeleton-avatar-circle {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .skeleton-icon-circle {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                }

                .skeleton-action-pill {
                    border-radius: 6px;
                }

                .skeleton-email-detail .mail-content-details-box {
                    padding: 4px 0 24px;
                }

                .skeleton-body-line {
                    border-radius: 4px;
                }

                .skeleton-email-detail .application-attachments-box {
                    padding-top: 16px;
                    border-top: 1px solid #eef0f2;
                    margin-bottom: 20px;
                }

                .skeleton-email-detail .application-attachments-header {
                    margin-bottom: 14px;
                }

                .skeleton-email-detail .attachments-pdf-box-main {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .skeleton-email-detail .attachments-pdf-box {
                    width: 140px;
                }

                .skeleton-attachment-thumb {
                    width: 100%;
                    height: 90px;
                    border-radius: 8px;
                }

                .skeleton-email-detail .application-btn-multi:last-of-type {
                    margin-top: auto;
                    padding-top: 16px;
                }
            `}</style>
        </div>

    );
};

export default EmailDetailSkeletonLoader;