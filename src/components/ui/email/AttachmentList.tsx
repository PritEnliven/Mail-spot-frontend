import React, { useMemo } from 'react';
import fileIcon from '@images/file-icon.svg';
import { isIcsFilename } from '@utils/calendarInviteUtil';
import { filterNonInlineAttachments } from '@utils/emailCidUtil';

interface Attachment {
    filename: string;
    [key: string]: any;
}

interface AttachmentListProps {
    attachments: Attachment[];
    bodyHtml?: string | null;
    maxVisible?: number;
    className?: string;
}

const AttachmentList: React.FC<AttachmentListProps> = ({
    attachments,
    bodyHtml,
    maxVisible = 2
}) => {
    const visibleAttachments = useMemo(
        () => filterNonInlineAttachments(attachments, bodyHtml),
        [attachments, bodyHtml]
    );

    if (!visibleAttachments.length) return null;

    const shownAttachments = visibleAttachments.slice(0, maxVisible);
    const remainingCount = Math.max(0, visibleAttachments.length - maxVisible);

    return (
        <>
            {shownAttachments.map((attachment, index) => (
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
