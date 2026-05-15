import downloadIcon from "@images/arrow-down-tray-icon.svg";
import { config } from "../../../config/config";
import { useMemo } from "react";
import pdfIcon from "@images/pdf-image.png";
import docIcon from "@images/doc-image.png";
import xlsIcon from "@images/xls-image.png";
import pptIcon from "@images/xls-image.png";
import zipIcon from "@images/zip-image.png";
import videoIcon from "@images/video-image.png";
import codeIcon from "@images/code-image.png";
import emlIcon from "@images/eml-image.png";
import defaultIcon from "@images/no-image.png";

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN = import.meta.env.VITE_TOKEN;

interface Attachment {
    customFileName: string;
    filename: string;
    size: number;
    isEml: boolean;
    isSchedule?: boolean;
}

interface Props {
    attachments: Attachment[];
    messageId: string;
    onDownloadAttachment: (downloadType: string, customFileName: string, fileName: string, messageid: string) => void;
    onOpenAttachment: (customFileName: string, filename: string, isEml: boolean) => void;
}

const EmailDetailAttachmentPreview = ({
    attachments,
    messageId,
    onDownloadAttachment,
    onOpenAttachment
}: Props) => {
    if (attachments.length === 0) return null;

    // Cache preview URLs to prevent continuous requests
    const attachmentPreviews = useMemo(() => {
        return attachments.map((attachment) => {
            const extension = attachment.filename.split('.').pop()?.toLowerCase();

            const isImage = ["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(
                extension || ""
            );

            return {
                ...attachment,
                isImage,
                previewUrl: isImage
                    ? `${API_URL}/preview/${TOKEN}/${attachment.customFileName}${attachment.isSchedule ? "?isSchedule=true" : ""}`
                    : getAttachmentIcon(attachment.filename)
            };
        });
    }, [attachments]);

    function getAttachmentIcon(filename: string) {
        if (!filename) return defaultIcon;

        const extension = filename.split('.').pop()?.toLowerCase() || "";

        const iconMap: Record<string, string> = {
            pdf: pdfIcon,

            doc: docIcon, docx: docIcon, odt: docIcon,
            xls: xlsIcon, xlsx: xlsIcon, csv: xlsIcon, ods: xlsIcon,
            ppt: pptIcon, pptx: pptIcon, odp: pptIcon,
            txt: docIcon, rtf: docIcon,

            zip: zipIcon, rar: zipIcon, "7z": zipIcon, tar: zipIcon, gz: zipIcon,

            mp4: videoIcon, avi: videoIcon, mov: videoIcon, wmv: videoIcon,
            mkv: videoIcon, webm: videoIcon, flv: videoIcon,


            js: codeIcon, jsx: codeIcon, ts: codeIcon, tsx: codeIcon,
            html: codeIcon, htm: codeIcon,
            css: codeIcon, scss: codeIcon, sass: codeIcon, less: codeIcon,
            json: codeIcon, yml: codeIcon, yaml: codeIcon,

            eml: emlIcon,
        };

        return iconMap[extension] || defaultIcon;
    }

    const totalAttachmentSize = attachments.reduce((total, attachment) => total + attachment.size, 0);

    return (
        <div className="application-attachments-box no-border">
            <div className="d-flex align-items-center justify-content-between application-attachments-header">
                <div className="sm-name">
                    {attachments.length} Attachments
                    <span className="space-size ms-2">
                        {(totalAttachmentSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                </div>
                <a
                    href="javascript:;"
                    onClick={() => onDownloadAttachment('all', '', '', messageId)}
                    className="hover-link single-icon"
                >
                    <img
                        className="hover-image"
                        src={downloadIcon}
                        alt="download all"
                    />
                </a>
            </div>

            <div className="attachments-pdf-box-main d-flex align-items-start flex-wrap">
                {attachmentPreviews.map((attachment, index) => (
                    <div
                        key={`${attachment.customFileName}-${index}`}
                        className="attachments-pdf-box"
                        onClick={() => onOpenAttachment(attachment.customFileName, attachment.filename, attachment.isEml)}
                        data-tooltip-id={config.TOOLTIP_ID}
                        data-tooltip-content={attachment.filename}
                        data-tooltip-place="top"
                    >
                        <div className="attachments-img-box">
                            <img
                                className="attachments-img-box-img"
                                src={attachment.previewUrl}
                                alt="file"
                                loading="lazy"
                                onError={(e) => {
                                    console.log("error while fetching preview : ", e);
                                    if (attachment.isImage) {
                                        e.currentTarget.src = getAttachmentIcon(attachment.filename);
                                    }
                                }}
                            />
                            <div className="attachments-pdf-download">
                                <button
                                    style={{ zIndex: 999999, position: "relative" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDownloadAttachment('single', attachment.customFileName, attachment.filename, messageId);
                                        return false;
                                    }}
                                    className="hover-link single-icon"
                                >
                                    <img
                                        className="hover-image"
                                        src={downloadIcon}
                                        alt="download"
                                    />
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="pdf-name m-0">{attachment.filename}</p>
                            <span className="space-size">{(attachment.size / 1024).toFixed(2)} KB</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmailDetailAttachmentPreview;
