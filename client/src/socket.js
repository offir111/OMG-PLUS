import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const reconnectionOptions = {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
};

export const socket = io(API_URL, { ...reconnectionOptions, auth: {} });
export const faithSocket = io(`${API_URL}/faith`, { ...reconnectionOptions });

export function connectSocket(username, side) {
  socket.auth = { username, side };
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}

export function getConnectionStatus() {
  if (socket.connected) return 'connected';
  if (socket.active) return 'reconnecting';
  return 'disconnected';
}
