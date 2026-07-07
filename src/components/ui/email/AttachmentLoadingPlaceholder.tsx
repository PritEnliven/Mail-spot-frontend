import attachmentIcon from "@images/attachment-stroke-rounded-icon.svg";

interface Props {
    filename?: string;
    size?: number;
}

const formatSize = (size: number) =>
    size < 1024 * 1024
        ? `${(size / 1024).toFixed(2)} KB`
        : `${(size / (1024 * 1024)).toFixed(2)} MB`;

const AttachmentLoadingPlaceholder = ({ filename, size }: Props) => (
    <div className="attachments-pdf-box attachment-processing">
        <div className="attachments-img-box attachment-loading-thumb">
            <img
                src={attachmentIcon}
                alt=""
                className="attachment-loading-icon"
                aria-hidden="true"
            />
        </div>
        <div>
            {filename ? (
                <p className="pdf-name m-0">{filename}</p>
            ) : (
                <div className="attachment-skeleton-line attachment-skeleton-line--name" />
            )}
            {size ? (
                <span className="space-size">{formatSize(size)}</span>
            ) : (
                <div className="attachment-skeleton-line attachment-skeleton-line--size" />
            )}
        </div>
        <style>
            {`.attachment-processing {
                pointer-events: none;
                cursor: default;
            }

            .attachment-processing .attachments-img-box.attachment-loading-thumb {
                background: linear-gradient(90deg, #edeef0 25%, #f6f7f8 37%, #edeef0 63%);
                background-size: 400% 100%;
                animation: attachment-skeleton-shimmer 1.4s ease infinite;
            }

            .attachment-loading-icon {
                width: 32px;
                height: 32px;
                opacity: 0.4;
            }

            .attachment-skeleton-line {
                background: linear-gradient(90deg, #edeef0 25%, #f6f7f8 37%, #edeef0 63%);
                background-size: 400% 100%;
                animation: attachment-skeleton-shimmer 1.4s ease infinite;
                border-radius: 4px;
                margin-top: 4px;
            }

            .attachment-skeleton-line--name {
                width: 100px;
                height: 12px;
            }

            .attachment-skeleton-line--size {
                width: 60px;
                height: 10px;
            }

            @keyframes attachment-skeleton-shimmer {
                0% {
                    background-position: 100% 50%;
                }

                100% {
                    background-position: 0 50%;
                }
            }`}
        </style>
    </div>
);

export default AttachmentLoadingPlaceholder;
