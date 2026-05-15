import { useMailData } from '../context/index';
import { downloadAttachmentFunc } from '@services/email/emailService';
import { useState } from 'react';

interface DownloadOptions {
    downloadType: 'single' | 'all';
    customFileName: string;
    fileName: string;
    messageId: string;
}

export function useAttachmentDownload() {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const { boxName, emailDetailSelected } = useMailData();

    const downloadAttachment = async ({ downloadType, customFileName, fileName, messageId }: DownloadOptions) => {
        setIsDownloading(true);
        setDownloadError(null);

        try {
            const payload = {
                downloadType: downloadType,
                customFileName: customFileName,
                messageId: messageId,
                currentActiveBox: boxName
            }
            const response = await downloadAttachmentFunc(payload)

            if (!response) {
                throw new Error('Download failed');
            }

            const blob = response;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            if (downloadType === 'all') {
                link.download = `${emailDetailSelected?.subject || 'attachments'}.zip`;
            } else {
                link.download = fileName;
            }

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown download error';
            setDownloadError(errorMessage);
            console.error('Download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadAttachments = (downloadType: string, customFileName: string, fileName: string, messageId: string) => {
        downloadAttachment({
            downloadType: downloadType as 'single' | 'all',
            customFileName,
            fileName,
            messageId
        });
    };

    const clearError = () => {
        setDownloadError(null);
    };

    return {
        isDownloading,
        downloadError,
        downloadAttachments,
        downloadAttachment,
        clearError
    };
}
