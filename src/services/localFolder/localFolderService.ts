import { downloadBlobFile } from '../contact/contactService';
import { getData, postData } from '../apiService';

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
    | { success: true; blob: Blob; filename: string }
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

async function parseJsonBlob(blob: Blob): Promise<Record<string, unknown> | null> {
    try {
        const text = await blob.text();
        return JSON.parse(text) as Record<string, unknown>;
    } catch {
        return null;
    }
}

async function parseExportErrorBlob(blob: Blob, fallback: string) {
    const parsed = await parseJsonBlob(blob);
    if (!parsed) return { message: fallback, failed: undefined as EmlExportFailedItem[] | undefined };
    const message =
        (typeof parsed.message === 'string' && parsed.message) ||
        (typeof parsed.error === 'string' && parsed.error) ||
        fallback;
    const failed = Array.isArray(parsed.failed) ? (parsed.failed as EmlExportFailedItem[]) : undefined;
    return { message, failed };
}

function isJsonBlob(blob: Blob) {
    return blob.type.includes('application/json') || blob.type.includes('text/json');
}

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

/** True when blob is a ZIP (PK..), even if the UI guessed .eml from selection count. */
async function blobLooksLikeZip(blob: Blob): Promise<boolean> {
    const type = String(blob.type || '').toLowerCase();
    if (
        type === 'application/zip' ||
        type === 'application/x-zip-compressed' ||
        type === 'multipart/x-zip'
    ) {
        return true;
    }
    try {
        const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
        return header.length >= 2 && header[0] === 0x50 && header[1] === 0x4b; // "PK"
    } catch {
        return false;
    }
}

function resolveExportFilename(isZip: boolean, selectedCount: number): string {
    if (isZip) return `archived-mail-export-${Date.now()}.zip`;
    return selectedCount === 1 ? 'email.eml' : 'emails-export.zip';
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

/** POST /localFolder/exportEml — binary .eml (1) or .zip (thread / multi / folder). Local folders only. */
async function exportEml(payload: ExportEmlPayload): Promise<ExportEmlResult> {
    const isFolderExport = 'folderId' in payload && typeof payload.folderId === 'string';
    const fallbackMessage = isFolderExport ? 'Failed to export folder' : 'Failed to export as EML';
    const format = payload.format;

    let body: Record<string, unknown>;
    let selectedCount = 0;

    if (isFolderExport) {
        const folderId = payload.folderId.trim();
        if (!folderId) {
            return { success: false, message: 'Invalid local folder', statusCode: 400 };
        }
        body = { folderId };
        if (format) body.format = format;
        // Unknown count; zip vs single .eml is decided from the response bytes.
        selectedCount = 2;
    } else {
        const ids = [...new Set(payload.messageIds.map((id) => id.trim()).filter(Boolean))];
        if (ids.length === 0) {
            return { success: false, message: 'No emails selected', statusCode: 400 };
        }
        body = { messageIds: ids };
        if (format) body.format = format;
        selectedCount = ids.length;
    }

    try {
        const data = await postData('localFolder/exportEml', body, { responseType: 'blob' });

        if (!(data instanceof Blob)) {
            return { success: false, message: fallbackMessage, statusCode: 500 };
        }

        if (isJsonBlob(data)) {
            const { message, failed } = await parseExportErrorBlob(data, fallbackMessage);
            return {
                success: false,
                message: resolveExportErrorMessage(message, 400, isFolderExport ? 'folder' : 'messages', fallbackMessage),
                statusCode: 400,
                failed,
            };
        }

        // Backend expands a single selected thread into a ZIP. Never trust
        // selection count alone for the download extension.
        const isZip = await blobLooksLikeZip(data);
        const filename = resolveExportFilename(
            isZip,
            isFolderExport ? (isZip ? 2 : 1) : selectedCount
        );
        const blob = isZip
            ? new Blob([data], { type: 'application/zip' })
            : new Blob([data], { type: data.type || 'message/rfc822' });

        return { success: true, blob, filename };
    } catch (error: any) {
        if (error instanceof Blob) {
            const { message, failed } = await parseExportErrorBlob(error, fallbackMessage);
            return {
                success: false,
                message: resolveExportErrorMessage(
                    message,
                    400,
                    isFolderExport ? 'folder' : 'messages',
                    fallbackMessage
                ),
                statusCode: 400,
                failed,
            };
        }

        // Axios interceptor may leave a Blob on error.response-shaped rejects
        if (error?.data instanceof Blob) {
            const statusCode = error?.statusCode || 400;
            const { message, failed } = await parseExportErrorBlob(error.data, fallbackMessage);
            return {
                success: false,
                message: resolveExportErrorMessage(
                    message,
                    statusCode,
                    isFolderExport ? 'folder' : 'messages',
                    fallbackMessage
                ),
                statusCode,
                failed,
            };
        }

        const statusCode = error?.statusCode || 500;
        return {
            success: false,
            message: resolveExportErrorMessage(
                error?.message,
                statusCode,
                isFolderExport ? 'folder' : 'messages',
                fallbackMessage
            ),
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
