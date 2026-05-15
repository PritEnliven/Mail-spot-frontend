import closeIcon from '@images/close-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import fileIcon from '@images/file-icon.svg';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import { config } from '../../config/config';
import type { AttachmentItem } from '@hooks/useAttachmentManager';

interface AttachmentPreviewProps {
    attachments: AttachmentItem[];
    onRemove: (index: number) => void;
}

export default function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
    if (attachments.length === 0) return null;
    
    const getFileName = (attachment: AttachmentItem): string => {
        return 'customFileName' in attachment ? attachment.customFileName : attachment.name;
    };
    
    const getFileSize = (attachment: AttachmentItem): string => {
        const size = 'size' in attachment ? attachment.size : 0;
        if (size === 0) return '';
        
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };
    
    return (
        <div className="compose-mail-attachments">
            <ul className="compose-mail-attachments-list attachments-box-small" id="composeMailAttachmentsList">
                {attachments.map((attachment, index) => (
                    <li key={index} data-filename={getFileName(attachment)}>
                        <div className="attachments-box"
                            data-tooltip-id={config.TOOLTIP_ID}
                            data-tooltip-content={getFileName(attachment)}
                            data-tooltip-place="top">
                            <div className="file-icon me-2">
                                <img className="hover-image" src={fileIcon} width="20" height="20" alt="File" />
                            </div>
                            <div className="file-name">
                                <div className="name">
                                    {getFileName(attachment)}
                                </div>
                                {getFileSize(attachment) && (
                                    <div className="size">
                                        {getFileSize(attachment)}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                className="btn-file-download"
                                data-tooltip-content="Remove attachment"
                                data-tooltip-place="top"
                                onClick={() => onRemove(index)}
                            >
                                <InteractiveIcon
                                    defaultIcon={closeIcon}
                                    hoverIcon={closeIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt="Remove"
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Remove attachment"
                                />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
