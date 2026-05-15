import { io, type Socket } from 'socket.io-client';
import { updateSocketId } from '@services/socket/socketService';

let socket: Socket | null = null;
let initializing = false;
let permanentFailure = false;

// Server-initiated or client-initiated closes are intentional — no point retrying.
// Transient failures (ping timeout, transport close/error) are handled automatically
// by socket.io's built-in reconnection logic (reconnectionAttempts: 5).
const PERMANENT_DISCONNECT_REASONS = new Set([
    'io server disconnect',
    'io client disconnect',
]);

const connectSocket = async (): Promise<Socket> => {
    if (socket && socket.connected) return socket;
    if (permanentFailure) return Promise.reject(new Error('Socket permanently disconnected'));

    if (initializing) {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (permanentFailure) {
                    clearInterval(interval);
                    reject(new Error('Socket permanently disconnected'));
                } else if (socket && socket.connected) {
                    clearInterval(interval);
                    resolve(socket!);
                }
            }, 50);
        });
    }

    initializing = true;

    socket = io(import.meta.env.VITE_API_URL as string, {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        auth: { email: localStorage.getItem('email') },
    });

    // CENTRALIZED updateSocketId
    socket.on('connect', async () => {
        try {
            const oldSocketId = localStorage.getItem('socketId');
            if (socket?.id !== oldSocketId) {
                await updateSocketId({
                    email: localStorage.getItem('email') || '',
                    oldSocketId,
                    socketId: socket?.id || '',
                });
                localStorage.setItem('socketId', socket?.id || '');
                console.log('Socket connected and updated:', socket?.id);
            }
        } catch (err) {
            console.error('Socket connect error', err);
        }
    });

    socket.on('disconnect', (reason) => {
        console.warn('Socket disconnected:', reason);
        // socket.io's own reconnection handles transient drops automatically.
        // Mark permanent only for intentional closes so callers can stop retrying.
        if (PERMANENT_DISCONNECT_REASONS.has(reason)) {
            console.warn('Permanent disconnect — will not attempt reconnection:', reason);
            permanentFailure = true;
        }
    });

    return new Promise<Socket>((resolve, reject) => {
        const cleanup = () => {
            socket?.off('connect', onConnect);
            socket?.off('connect_error', onConnectError);
            socket?.off('reconnect_failed', onReconnectFailed);
        };

        const onConnect = () => {
            cleanup();
            initializing = false;
            resolve(socket!);
        };

        // Fires on each failed attempt while socket.io is still retrying — log only.
        const onConnectError = (err: Error) => {
            console.error('Socket connection attempt failed:', err.message);
        };

        // Fires after all reconnectionAttempts are exhausted — this is terminal.
        const onReconnectFailed = () => {
            cleanup();
            initializing = false;
            permanentFailure = true;
            reject(new Error('Socket failed to connect after all attempts'));
        };

        socket?.once('connect', onConnect);
        socket?.on('connect_error', onConnectError);
        socket?.once('reconnect_failed', onReconnectFailed);
        socket?.connect();
    });
};

const getSocket = async (): Promise<Socket> => {
    if (socket && socket.connected) return socket;
    return connectSocket();
};

const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
    initializing = false;
    permanentFailure = false;
};

export { connectSocket, getSocket, disconnectSocket };
