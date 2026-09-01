import React from 'react';
import fileIcon from '@images/file-icon.svg';
import { isIcsFilename } from '@utils/calendarInviteUtil';

interface Attachment {
    filename: string;
}

interface AttachmentListProps {
    attachments: Attachment[];
    maxVisible?: number;
    className?: string;
}

const AttachmentList: React.FC<AttachmentListProps> = ({
    attachments,
    maxVisible = 2
}) => {
    if (!attachments?.length) return null;

    const visibleAttachments = attachments.slice(0, maxVisible);
    const remainingCount = Math.max(0, attachments.length - maxVisible);

    return (
        <>
            {visibleAttachments.map((attachment, index) => (
                <a
                    key={`${attachment.filename}-${index}`}
                    className="hover-link mail-received-attachment-list"
                    onClick={(e) => {
                        e.preventDefault();
                        console.log('Attachment clicked:', attachment.filename);
                    }}
                >
                    <img
                        className="hover-image"
                        src={fileIcon}
                        alt="File icon"
                    />
                    
                    <span className="mail-attachment-text">
                        {isIcsFilename(attachment.filename) ? 'Calendar invite' : attachment.filename}
                    </span>
                </a>
            ))}

            {remainingCount > 0 && (
                <a href='' className="mail-received-attachment-list attachment-count-file">
                    +{remainingCount}
                </a>
            )}
        </>
    );
};

export default AttachmentList;