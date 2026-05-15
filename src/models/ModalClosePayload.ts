export type CloseReason = 'success' | 'error' | 'cancel';

export const closeReason = {
    success: 'success',
    error: 'error',
    cancel: 'cancel',
} as const;

export interface ModalClosePayload<T = unknown> {
    reason: CloseReason;
    data?: T;
    error?: unknown;
}
