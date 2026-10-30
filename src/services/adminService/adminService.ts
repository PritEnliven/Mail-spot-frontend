
import { getData, postData } from '../apiService';

interface loginPayload {
    username: string;
    password: string;
    role?: "admin";
}

interface ChangePasswordPayload {
    userId: string;
    password: string;
}

interface loginAdminAsUserPayload {
    userId: string;
}

interface getAdminSettingsPayload {
    isAdmin: boolean
    userId: string | null;
    role: string;
}

interface adminSaveSettingsPayload {
    fileSize: number,
    allowedFileTypes: string[],
    sendToOutsideDomain: boolean
    receiveFromOutsideDomain: boolean
    both: boolean
    aiFeatures: boolean
    isAdmin: boolean
    userId?: string | null
    status: boolean | true
}

async function adminLogin(payload: loginPayload) {
    payload.role = "admin";
    try {
        const response = await postData('admin/login', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

interface GetUserListParams {
    page: number;
    limit: number;
    /** true = only users with hours enabled; false = without hours; omit = all */
    standardHoursEnabled?: boolean;
}

type OutsideMailType = 'sent' | 'received';
type OutOfHoursMailType = 'sent' | 'received' | 'all';

interface StandardHoursDay {
    day: number;
    start: string;
    end: string;
}

interface StandardHoursConfig {
    enabled: boolean;
    days?: StandardHoursDay[];
}

interface SaveUserStandardHoursPayload {
    userId: string;
    timeZone?: string;
    standardHours: StandardHoursConfig;
}

interface GetOutsideMailUsersParams {
    search?: string;
    page?: number;
    limit?: number;
}

interface GetOutsideMailParams {
    userId: string;
    type: OutsideMailType;
    search?: string;
    page?: number;
    limit?: number;
}

interface GetOutOfHoursMailParams {
    userId: string;
    type?: OutOfHoursMailType;
    search?: string;
    page?: number;
    limit?: number;
}

async function adminGetUserList({ page, limit, standardHoursEnabled }: GetUserListParams) {
    try {
        const response = await getData('admin/getUserList', {
            params: {
                page,
                limit,
                ...(standardHoursEnabled === undefined
                    ? {}
                    : { standardHoursEnabled }),
            },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function resetPasswordByAdmin(payload: ChangePasswordPayload) {
    try {
        const response = await postData('admin/changePassword', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}
async function loginAdminAsUser(payload: loginAdminAsUserPayload) {
    try {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            return {
                statusCode: 401,
                message: 'Admin session expired. Please log in again.',
            };
        }
        const response = await postData('admin/loginAdminAsUser', payload, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getAdminSettings(payload: getAdminSettingsPayload) {
    try {
        const response = await getData('admin/getAdminSettings', {
            headers: {
                'role': payload.role,
                userId: payload.userId ?? null
            }
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function adminSaveSettings(payload: adminSaveSettingsPayload) {
    try {
        const response = await postData('admin/saveSettings', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function adminGetOutsideMailUsers({ search, page = 1, limit = 50 }: GetOutsideMailUsersParams = {}) {
    try {
        const response = await getData('admin/getOutsideMailUsers', {
            params: {
                ...(search ? { search } : {}),
                page,
                limit,
            },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function adminGetOutsideMail({ userId, type, search = '', page = 1, limit = 25 }: GetOutsideMailParams) {
    try {
        const response = await getData('admin/getOutsideMail', {
            params: { userId, type, search, page, limit },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function adminGetOutsideMailEmail(userId: string, id: string) {
    try {
        const response = await getData('admin/getOutsideMailEmail', {
            params: { userId, id },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteUser(userId: string) {
    try {
        const response = await postData('admin/deleteUser', { userId });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function adminGetUserStandardHours(userId: string) {
    try {
        const response = await getData('admin/getUserStandardHours', {
            params: { userId },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function adminSaveUserStandardHours(payload: SaveUserStandardHoursPayload) {
    try {
        const response = await postData('admin/saveUserStandardHours', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function adminGetOutOfHoursMail({
    userId,
    type = 'all',
    search = '',
    page = 1,
    limit = 25,
}: GetOutOfHoursMailParams) {
    try {
        const response = await getData('admin/getOutOfHoursMail', {
            params: { userId, type, search, page, limit },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function adminGetOutOfHoursMailEmail(userId: string, id: string) {
    try {
        const response = await getData('admin/getOutOfHoursMailEmail', {
            params: { userId, id, emailId: id },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}


export {
    adminGetOutOfHoursMail,
    adminGetOutOfHoursMailEmail,
    adminGetOutsideMail,
    adminGetOutsideMailEmail,
    adminGetOutsideMailUsers,
    adminGetUserList,
    adminGetUserStandardHours,
    adminLogin,
    adminSaveSettings,
    adminSaveUserStandardHours,
    deleteUser,
    getAdminSettings,
    loginAdminAsUser,
    resetPasswordByAdmin,
};
export type {
    OutOfHoursMailType,
    OutsideMailType,
    SaveUserStandardHoursPayload,
    StandardHoursConfig,
    StandardHoursDay,
};
