import { putData } from '../apiService';

interface updateSocketPayload {
    email: string,
    oldSocketId: string | null,
    socketId: string
}

async function updateSocketId(payload: updateSocketPayload) {
    try {
        const response = await putData('email/updateSocketId', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    updateSocketId
}