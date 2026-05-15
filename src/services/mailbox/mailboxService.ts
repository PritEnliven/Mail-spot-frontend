import { getData } from '../apiService';

async function getBoxes() {
    try {
        const response = await getData('email/get-boxes');
        return response.data;
    } catch (error: any) {
        return error;
    }
}

export {
    getBoxes,
};