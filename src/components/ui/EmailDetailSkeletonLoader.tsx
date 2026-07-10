
interface EmailDetailSkeletonLoaderProps {
    toCount?: number;
    attachmentCount?: number;
}

const EmailDetailSkeletonLoader = ({ toCount = 2, attachmentCount = 3, }: EmailDetailSkeletonLoaderProps) => {
    return (
        <div className="email-detail-skeleton">
            {/* Title */}
            <div className="skeleton-shimmer email-detail-skeleton__title" />
            <div className="email-detail-skeleton__divider" />

            {/* From row */}
            <div className="email-detail-skeleton__row">
                <div className="skeleton-shimmer email-detail-skeleton__row-label" />
                <div className="skeleton-shimmer email-detail-skeleton__avatar" />
                <div className="email-detail-skeleton__from-info">
                    <div className="skeleton-shimmer email-detail-skeleton__from-name" />
                    <div className="skeleton-shimmer email-detail-skeleton__from-email" />
                </div>
                <div className="skeleton-shimmer email-detail-skeleton__date" />
            </div>
            {/* To row */}
            <div className="email-detail-skeleton__row">
                <div className="skeleton-shimmer email-detail-skeleton__row-label" />
                <div className="email-detail-skeleton__to-pills">
                    {Array.from({ length: toCount }).map((_, index) => (
                        <div key={index} className="email-detail-skeleton__pill" />
                    ))}
                </div>
                <div className="email-detail-skeleton__actions">
                    <div className="skeleton-shimmer email-detail-skeleton__action-btn" />
                    <div className="skeleton-shimmer email-detail-skeleton__action-btn" />
                    <div className="skeleton-shimmer email-detail-skeleton__action-btn" />
                </div>
            </div>
            <div className="email-detail-skeleton__divider" />

            {/* Subject */}
            <div className="email-detail-skeleton__subject">
                <div className="skeleton-shimmer email-detail-skeleton__subject-line" />
            </div>

            {/* Body */}
            <div className="email-detail-skeleton__body">
                <div className="skeleton-shimmer email-detail-skeleton__body-line" />
                <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--95" />
                <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--50" />
                <div className="email-detail-skeleton__body-gap" />
                <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--90" />
                <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--70" />
                <div className="email-detail-skeleton__body-gap" />
                <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--90" />
                <div className="skeleton-shimmer email-detail-skeleton__body-line email-detail-skeleton__body-line--60" />
            </div>
            <div className="email-detail-skeleton__divider" />

            {/* Attachments header */}
            <div className="email-detail-skeleton__attach-header">
                <div className="skeleton-shimmer email-detail-skeleton__attach-count" />
                <div className="skeleton-shimmer email-detail-skeleton__attach-download" />
            </div>

            {/* Attachments grid */}
            <div className="email-detail-skeleton__attach-grid">
                {Array.from({ length: attachmentCount }).map((_, index) => (
                    <div key={index} className="email-detail-skeleton__attach-card">
                        <div className="skeleton-shimmer email-detail-skeleton__attach-thumb" />
                        <div className="skeleton-shimmer email-detail-skeleton__attach-name" />
                        <div className="skeleton-shimmer email-detail-skeleton__attach-size" />
                    </div>
                ))}
            </div>

            {/* Footer buttons */}
            <div className="email-detail-skeleton__footer">
                <div className="skeleton-shimmer email-detail-skeleton__footer-btn" />
                <div className="skeleton-shimmer email-detail-skeleton__footer-btn" />
                <div className="skeleton-shimmer email-detail-skeleton__footer-btn" />
            </div>
        </div>
    );
};

export default EmailDetailSkeletonLoader;