const EmailDetailSkeletonLoader = ({ attachmentCount = 2 }: { attachmentCount?: number }) => {
    return (
        <div className="email-detail-skeleton">
            <div className="email-detail-skeleton__content">
                {/* Header: avatar + sender */}
                <div className="email-detail-skeleton__header">
                    <div className="skeleton-shimmer email-detail-skeleton__avatar" />
                    <div className="email-detail-skeleton__sender">
                        <div className="skeleton-shimmer email-detail-skeleton__sender-name" />
                        <div className="skeleton-shimmer email-detail-skeleton__sender-email" />
                    </div>
                </div>

                {/* Subject */}
                <div className="email-detail-skeleton__subject">
                    <div className="skeleton-shimmer email-detail-skeleton__subject-line" />
                    <div className="skeleton-shimmer email-detail-skeleton__subject-line email-detail-skeleton__subject-line--short" />
                </div>

                {/* Body */}
                <div className="email-detail-skeleton__body">
                    <div className="skeleton-shimmer email-detail-skeleton__body-line" />
                    <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--95" />
                    <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--98" />
                    <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--60" />
                    <div className="email-detail-skeleton__body-gap" />
                    <div className="skeleton-shimmer email-detail-skeleton__body-line" />
                    <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--92" />
                    <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--40" />
                </div>

                {/* Attachments */}
                <div className="email-detail-skeleton__attachments">
                    {Array.from({ length: attachmentCount }).map((_, index) => (
                        <div
                            key={index}
                            className="skeleton-shimmer email-detail-skeleton__attachment-pill"
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes email-detail-skeleton-shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                .email-detail-skeleton {
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                }

                .email-detail-skeleton .skeleton-shimmer {
                    background: linear-gradient(90deg,
                        rgba(231, 232, 234, 1) 25%,
                        rgba(243, 244, 246, 1) 50%,
                        rgba(231, 232, 234, 1) 75%);
                    background-size: 200% 100%;
                    animation: email-detail-skeleton-shimmer 1.5s infinite linear;
                }

                .email-detail-skeleton__content {
                    width: 100%;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .email-detail-skeleton__header {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .email-detail-skeleton__avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .email-detail-skeleton__sender {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    flex: 1;
                }

                .email-detail-skeleton__sender-name {
                    height: 20px;
                    width: 280px;
                    max-width: 60%;
                    border-radius: 8px;
                }

                .email-detail-skeleton__sender-email {
                    height: 12px;
                    width: 380px;
                    max-width: 75%;
                    border-radius: 8px;
                    opacity: 0.6;
                }

                .email-detail-skeleton__subject {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .email-detail-skeleton__subject-line {
                    height: 40px;
                    width: 100%;
                    border-radius: 8px;
                }

                .email-detail-skeleton__subject-line--short {
                    width: 85%;
                }

                .email-detail-skeleton__body {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #e7e8ea;
                }

                .email-detail-skeleton__body-line {
                    height: 16px;
                    width: 100%;
                    border-radius: 8px;
                }

                .email-detail-skeleton__body-line--95 { width: 95%; }
                .email-detail-skeleton__body-line--98 { width: 98%; }
                .email-detail-skeleton__body-line--60 { width: 60%; }
                .email-detail-skeleton__body-line--92 { width: 92%; }
                .email-detail-skeleton__body-line--40 { width: 40%; }

                .email-detail-skeleton__body-gap {
                    height: 16px;
                }

                .email-detail-skeleton__attachments {
                    display: flex;
                    gap: 16px;
                    padding-top: 48px;
                }

                .email-detail-skeleton__attachment-pill {
                    height: 48px;
                    width: 160px;
                    border-radius: 12px;
                }

                @media (min-width: 768px) {
                    .email-detail-skeleton__content {
                        padding: 32px;
                    }
                }
            `}</style>
        </div>
    );
};

export default EmailDetailSkeletonLoader;
