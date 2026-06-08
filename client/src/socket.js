import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const socket = io(API_URL, { autoConnect: false, auth: {} });
export const faithSocket = io(`${API_URL}/faith`, { autoConnect: false });

export function connectSocket(username, side) {
  socket.auth = { username, side };
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}
