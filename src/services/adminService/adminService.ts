
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
}

async function adminGetUserList({ page, limit }: GetUserListParams) {
    try {
        const response = await getData('admin/getUserList', {
            params: { page, limit },
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

async function deleteUser(userId: string) {
    try {
        const response = await postData('admin/deleteUser', { userId });
        return response;
    } catch (error: any) {
        return error;
    }
}


export {
    adminGetUserList, adminLogin, adminSaveSettings, deleteUser, getAdminSettings, loginAdminAsUser, resetPasswordByAdmin
};
