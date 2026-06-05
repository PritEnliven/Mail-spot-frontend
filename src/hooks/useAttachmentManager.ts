import { showError } from "@components/ui/toast/toastNotification";
import { useMailData } from "@context/MailDataContext";
import { useState } from "react";

export type ExistingAttachment = {
    _id: string;
    name: string;
    customFileName: string;
    contentType: string;
    size: number;
    isExisting: true;
};

export type AttachmentItem = File | ExistingAttachment;

export function isExistingAttachment(
    item: AttachmentItem
): item is ExistingAttachment {
    return (item as ExistingAttachment).isExisting === true;
}

function getAttachmentName(item: AttachmentItem): string {
    return isExistingAttachment(item) ? item.name : item.name;
}

export function useAttachmentManager() {
    const { userPermissions, permissionsLoaded } = useMailData();
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const getMaxTotalBytes = (rawLimit: unknown): number | null => {
        if (typeof rawLimit !== 'number' || Number.isNaN(rawLimit) || rawLimit <= 0) return null;

        if (rawLimit > 1024 * 1024) return rawLimit;

        return rawLimit * 1024 * 1024;
    };

    const getFileExtension = (name: string): string => {
        const idx = name.lastIndexOf('.');
        if (idx === -1) return '';
        return name.slice(idx + 1).toLowerCase();
    };

    const normalizeAllowedTypes = (allowed: any[] | undefined | null): string[] => {
        if (!Array.isArray(allowed)) return [];
        return allowed
            .map(v => {
                if (typeof v === 'string') return v;
                if (v && typeof v === 'object') {
                    return v.value ?? v.name ?? v.type ?? '';
                }
                return '';
            })
            .filter(Boolean)
            .map((v: string) => v.toLowerCase());
    };

    const isFileTypeAllowed = (file: File, allowed: string[]): boolean => {
        if (allowed.length === 0) return true;

        const mime = (file.type || '').toLowerCase();
        const ext = getFileExtension(file.name);

        return allowed.some(rule => {
            const r = rule.trim().toLowerCase();
            if (!r) return false;
            if (r === mime) return true;
            if (r.startsWith('.')) return ext === r.slice(1);
            if (r === ext) return true;

            if (r.includes('/')) return mime === r;
            return false;
        });
    };

    const handleFileChange = (e: any) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
        e.target.value = "";
    };
    const setInitialAttachments = (existing: any[]) => {
        const normalized: ExistingAttachment[] = existing.map(att => ({
            _id: att._id,
            name: att.filename,
            customFileName: att.customFileName,
            contentType: att.contentType,
            size: att.size,
            isExisting: true,
        }));

        setAttachments(normalized);
    };

    const addFiles = (files: AttachmentItem[]) => {
        if (!permissionsLoaded) {
            const message = 'Permissions are not loaded yet. Please try again.';
            setError(message);
            showError(message);
            return;
        }

        const allowedTypes = normalizeAllowedTypes(userPermissions?.allowedFileTypes);
        const maxTotalBytes = getMaxTotalBytes(userPermissions?.fileSize);
        const currentTotalBytes = attachments.reduce((sum, item) => sum + (item?.size || 0), 0);

        const duplicates: string[] = [];
        const rejectedType: string[] = [];

        const filtered = files.filter(file => {
            const isDuplicate = attachments.some(existing =>
                getAttachmentName(existing) === getAttachmentName(file) &&
                existing.size === file.size
            );

            if (isDuplicate) {
                duplicates.push(getAttachmentName(file));
            }

            if (!isDuplicate && file instanceof File) {
                const ok = isFileTypeAllowed(file, allowedTypes);
                if (!ok) {
                    rejectedType.push(getAttachmentName(file));
                    return false;
                }
            }

            return !isDuplicate;
        });

        const incomingTotalBytes = filtered.reduce((sum, item) => sum + (item?.size || 0), 0);
        if (maxTotalBytes !== null && currentTotalBytes + incomingTotalBytes > maxTotalBytes) {
            const message = `Total attachment size exceeds your limit (${userPermissions?.fileSize}).`;
            setError(message);
            showError(message);
            return;
        }

        const errors: string[] = [];
        if (duplicates.length > 0) errors.push(`Duplicate files:\n${duplicates.join(', ')}`);
        if (rejectedType.length > 0) errors.push(`File type not allowed:\n${rejectedType.join(', ')}`);

        const errorMessage = errors.length > 0 ? errors.join('\n\n') : null;
        setError(errorMessage);
        if (errorMessage) {
            showError(errorMessage);
        }

        if (filtered.length > 0) {
            setAttachments(prev => [...prev, ...filtered]);
        }
    };

    const removeFile = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const resetAttachments = () => {
        setAttachments([]);
        setError(null);
    };

    return {
        attachments,
        error,
        addFiles,
        removeFile,
        resetAttachments,
        handleFileChange,
        setInitialAttachments
    };
}
