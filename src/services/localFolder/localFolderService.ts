import { downloadBlobFile } from '../contact/contactService';
import { getData, postData } from '../apiService';

const API_BASE = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export interface LocalFolderItem {
    key: string;
    value: string;
    folderId: string;
    displayName: string;
    color: string | null;
    unreadCount?: number;
    count?: number;
}

interface CreateLocalFolderPayload {
    folderName: string;
    color?: string | null;
}

interface RenameLocalFolderPayload {
    folderId: string;
    folderName?: string;
    color?: string | null;
}

interface DeleteLocalFolderPayload {
    folderId: string;
}

interface MoveToLocalFolderPayload {
    messageIds: string[];
    folderId: string;
}

interface MoveToImapPayload {
    messageIds: string[];
    /** IMAP folder the emails should land in (e.g. INBOX). */
    destinationFolder: string;
    /** Source local folder id when known (helps backend resolve local-only emails). */
    folderId?: string;
}

export interface EmlExportFailedItem {
    messageId?: string;
    reason?: string;
}

export type ExportEmlResult =
    | { success: true }
    | {
          success: false;
          message: string;
          statusCode?: number;
          failed?: EmlExportFailedItem[];
      };

export interface ImportEmlItem {
    fileName: string;
    messageId?: string;
    reason?: string;
}

export interface ImportEmlSummary {
    imported: number;
    alreadyExists: number;
    failed: number;
}

export type ImportEmlResult =
    | {
          success: true;
          imported: ImportEmlItem[];
          alreadyExists: ImportEmlItem[];
          failed: ImportEmlItem[];
          summary: ImportEmlSummary;
      }
    | { success: false; message: string; statusCode?: number };

const MAX_IMPORT_FILES = 20;
const MAX_EML_FILE_BYTES = 25 * 1024 * 1024;
/** Same 25MB cap applies to uploaded zip archives. */
const MAX_ZIP_FILE_BYTES = 500 * 1024 * 1024;
/** @deprecated Use MAX_IMPORT_FILES */
const MAX_EML_FILES = MAX_IMPORT_FILES;

async function listLocalFolders() {
    try {
        const response = await getData('localFolder/list');
        return response;
    } catch (error: any) {
        return error;
    }
}

async function createLocalFolder(payload: CreateLocalFolderPayload) {
    try {
        const response = await postData('localFolder/create', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function renameLocalFolder(payload: RenameLocalFolderPayload) {
    try {
        const response = await postData('localFolder/rename', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteLocalFolder(payload: DeleteLocalFolderPayload) {
    try {
        const response = await postData('localFolder/delete', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function moveToLocalFolder(payload: MoveToLocalFolderPayload) {
    try {
        const response = await postData('localFolder/moveToFolder', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function moveToImap(payload: MoveToImapPayload) {
    try {
        const response = await postData('localFolder/moveToImap', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export type ExportEmlFormat = 'auto' | 'eml' | 'bundle' | 'zip';

/** Exactly one of messageIds / folderId is required. */
export type ExportEmlPayload =
    | { messageIds: string[]; folderId?: never; format?: ExportEmlFormat }
    | { folderId: string; messageIds?: never; format?: ExportEmlFormat };

function resolveExportErrorMessage(
    message: string | undefined,
    statusCode: number | undefined,
    mode: 'messages' | 'folder',
    fallback: string
): string {
    const trimmed = message?.trim();
    if (trimmed && trimmed !== 'Something went wrong') return trimmed;
    if (mode === 'folder') {
        if (statusCode === 404) return 'Folder not found';
        if (statusCode === 400) return 'This folder has no emails to export';
    }
    return trimmed || fallback;
}

/** Resolve downloadUrl from token response (supports nested `data`). */
function extractDownloadUrl(response: unknown): string | null {
    if (!response || typeof response !== 'object') return null;
    const root = response as Record<string, unknown>;
    const nested =
        root.data && typeof root.data === 'object'
            ? (root.data as Record<string, unknown>)
            : null;
    const url =
        (typeof root.downloadUrl === 'string' && root.downloadUrl) ||
        (typeof nested?.downloadUrl === 'string' && nested.downloadUrl) ||
        null;
    return url?.trim() || null;
}

/** Browser download via signed URL — no axios timeout (cancel = browser failed download). */
function openSignedDownload(downloadUrl: string) {
    const href = /^https?:\/\//i.test(downloadUrl)
        ? downloadUrl
        : `${API_BASE}${downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`}`;

    const link = document.createElement('a');
    link.href = href;
    link.style.display = 'none';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * POST /localFolder/exportEml/token — Bearer + x-active-account-id create a signed URL;
 * browser then GETs the file (no axios blob / timeout on the zip itself).
 */
async function exportEml(payload: ExportEmlPayload): Promise<ExportEmlResult> {
    const isFolderExport = 'folderId' in payload && typeof payload.folderId === 'string';
    const fallbackMessage = isFolderExport ? 'Failed to export folder' : 'Failed to export as EML';
    const format = payload.format;
    const mode = isFolderExport ? 'folder' : 'messages';

    let body: Record<string, unknown>;

    if (isFolderExport) {
        const folderId = payload.folderId.trim();
        if (!folderId) {
            return { success: false, message: 'Invalid local folder', statusCode: 400 };
        }
        body = { folderId };
        if (format) body.format = format;
    } else {
        const ids = [...new Set(payload.messageIds.map((id) => id.trim()).filter(Boolean))];
        if (ids.length === 0) {
            return { success: false, message: 'No emails selected', statusCode: 400 };
        }
        body = { messageIds: ids };
        if (format) body.format = format;
    }

    try {
        // Normal axios timeout; mailbox header is attached by apiService for localFolder/*
        const response = await postData('localFolder/exportEml/token', body);
        const downloadUrl = extractDownloadUrl(response);

        if (!downloadUrl) {
            return {
                success: false,
                message: resolveExportErrorMessage(
                    typeof (response as any)?.message === 'string'
                        ? (response as any).message
                        : undefined,
                    500,
                    mode,
                    fallbackMessage
                ),
                statusCode: 500,
            };
        }

        openSignedDownload(downloadUrl);
        return { success: true };
    } catch (error: any) {
        const statusCode = error?.statusCode || 500;
        return {
            success: false,
            message: resolveExportErrorMessage(error?.message, statusCode, mode, fallbackMessage),
            statusCode,
            failed: Array.isArray(error?.failed) ? error.failed : undefined,
        };
    }
}

function isAllowedEmlFile(file: File): boolean {
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return name.endsWith('.eml') || type === 'message/rfc822' || type === 'application/eml';
}

function isAllowedZipFile(file: File): boolean {
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return (
        name.endsWith('.zip') ||
        type === 'application/zip' ||
        type === 'application/x-zip-compressed' ||
        type === 'multipart/x-zip'
    );
}

function isAllowedImportFile(file: File): boolean {
    return isAllowedEmlFile(file) || isAllowedZipFile(file);
}

/** Client-side checks before calling importEml. Returns an error message or null. */
function validateEmlFilesForImport(files: File[]): string | null {
    if (!files.length) return 'No files selected';
    // if (files.length > MAX_IMPORT_FILES) {
    //     return `You can import at most ${MAX_IMPORT_FILES} files at a time`;
    // }
    for (const file of files) {
        if (!isAllowedImportFile(file)) {
            return `"${file.name}" must be an EML or ZIP file`;
        }
        const maxBytes = isAllowedZipFile(file) ? MAX_ZIP_FILE_BYTES : MAX_EML_FILE_BYTES;
        if (file.size > maxBytes) {
            return `"${file.name}" exceeds the 25MB limit`;
        }
    }
    return null;
}

/** POST /localFolder/importEml — multipart folderId + files. Local folders only. */
async function importEml(folderId: string, files: File[]): Promise<ImportEmlResult> {
    const fallbackMessage = 'Failed to import EML';
    const id = folderId?.trim();
    if (!id) {
        return { success: false, message: 'Invalid local folder', statusCode: 400 };
    }

    const validationError = validateEmlFilesForImport(files);
    if (validationError) {
        return { success: false, message: validationError, statusCode: 400 };
    }

    const formData = new FormData();
    formData.append('folderId', id);
    for (const file of files) {
        formData.append('files', file, file.name);
    }

    try {
        const response: any = await postData('localFolder/importEml', formData);
        const body =
            response?.data &&
            (Array.isArray(response.data.imported) || response.data.summary)
                ? response.data
                : response;

        const imported: ImportEmlItem[] = Array.isArray(body?.imported) ? body.imported : [];
        const alreadyExists: ImportEmlItem[] = Array.isArray(body?.alreadyExists)
            ? body.alreadyExists
            : [];
        const failed: ImportEmlItem[] = Array.isArray(body?.failed) ? body.failed : [];
        const summary: ImportEmlSummary = {
            imported: Number(body?.summary?.imported ?? imported.length) || 0,
            alreadyExists: Number(body?.summary?.alreadyExists ?? alreadyExists.length) || 0,
            failed: Number(body?.summary?.failed ?? failed.length) || 0,
        };

        return {
            success: true,
            imported,
            alreadyExists,
            failed,
            summary,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error?.message || fallbackMessage,
            statusCode: error?.statusCode || 500,
        };
    }
}

export {
    listLocalFolders,
    createLocalFolder,
    renameLocalFolder,
    deleteLocalFolder,
    moveToLocalFolder,
    moveToImap,
    exportEml,
    importEml,
    validateEmlFilesForImport,
    downloadBlobFile,
    MAX_EML_FILES,
    MAX_IMPORT_FILES,
    MAX_EML_FILE_BYTES,
    MAX_ZIP_FILE_BYTES,
};
