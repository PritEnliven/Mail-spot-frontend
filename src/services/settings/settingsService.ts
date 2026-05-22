import { deleteData, getData, postData } from '../apiService';

interface saveSettingsPayload {
    undoSendPeriod: number
    pageSize: number
    signatureBody: string;
    signatureId: string;
    enableSignature: boolean;
    enableReplyForwardUse: boolean;
    threadView: boolean;
    downloadLocation: string;
    notification: boolean;
    recoveryEmail: string;
}

interface createSignatureNamePayload {
    isEdit: boolean;
    signatureName: string;
    setDefaultSignature: boolean;
}

interface deleteSignaturePayload {
    signatureId: string;
}

interface deleteRulePayload {
    ruleId: string;
}

async function getSettings() {
    try {
        const response = await getData('email/get-settings');
        return response;
    } catch (error: any) {
        return error;
    }
}

async function saveSettings(payload: saveSettingsPayload) {
    try {
        const response = await postData('email/save-settings', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function createSignatureName(payload: createSignatureNamePayload) {
    try {
        const response = await postData('email/save-signature-name', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteSignature(payload: deleteSignaturePayload) {
    try {
        const response = await deleteData(`email/delete-signature/${payload.signatureId}`, {});
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getAllRules() {
    try {
        const response = await getData('rule/getAllRules');
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteRule(payload: deleteRulePayload) {
    try {
        const response = await postData('rule/deleteRule', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getSignatureForActions() {
    try {
        const response = await getData('email/get-signature', {
            headers: {
                module: 'compose'
            }
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getAllSignatures() {
    try {
        const response = await getData('email/get-signatures', {
            headers: {
                module: 'compose'
            }
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getUserPermissions() {
    try {
        const response = await getData('email/get-permissions');
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    createSignatureName, deleteRule, deleteSignature,
    getAllRules,
    getAllSignatures, getSettings, getSignatureForActions,
    getUserPermissions, saveSettings
};
