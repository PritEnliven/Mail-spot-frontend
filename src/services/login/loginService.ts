import { postData } from '../apiService';

interface loginPayload {
    email: string;
    password: string;
    rememberMe?: boolean;
    role?: "user" | "admin";
}

async function loginUser(payload: loginPayload) {
    payload.role = "user";
    try {
        const response = await postData('auth/login', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    loginUser
}