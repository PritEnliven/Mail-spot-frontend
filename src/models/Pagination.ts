export interface Pagination {
    currentPage: number;
    totalPages: number;
    totalEmails: number;
    emailsPerPage: number;
    lastMailId: string;
    firstMailId: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCount: number;
    endCount: number;
    nextCursor?: string;
    prevCursor?: string | null;
    unreadCount: number;
}
