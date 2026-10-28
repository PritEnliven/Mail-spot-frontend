import { getData, postData } from '../apiService';

export interface AiLabel {
    _id: string;
    name: string;
    rulePrompt: string;
    color?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CreateAiLabelPayload {
    name: string;
    rulePrompt: string;
    color: string;
}

interface UpdateAiLabelPayload {
    labelId: string;
    name: string;
    rulePrompt: string;
    color: string;
}

interface DeleteAiLabelPayload {
    labelId: string;
}

interface UnlabelEmailPayload {
    messageId?: string;
    messageIds?: string[];
    label?: string;
    labelName?: string;
    labelId?: string;
}

async function createAiLabel(payload: CreateAiLabelPayload) {
    try {
        const response = await postData('ai-label/create', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function listAiLabels() {
    try {
        const response = await getData('ai-label/list');
        return response;
    } catch (error: any) {
        return error;
    }
}

async function updateAiLabel(payload: UpdateAiLabelPayload) {
    try {
        const response = await postData('ai-label/edit', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteAiLabel(payload: DeleteAiLabelPayload) {
    try {
        const response = await postData('ai-label/delete', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function unlabelEmail(payload: UnlabelEmailPayload) {
    try {
        const response = await postData('ai-label/unlabel-email', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    createAiLabel,
    listAiLabels,
    updateAiLabel,
    deleteAiLabel,
    unlabelEmail,
};
