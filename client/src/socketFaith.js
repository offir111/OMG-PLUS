import { faithSocket } from './socket.js';

export { faithSocket };

let refCount = 0;

export function acquireFaithChatConnection(username) {
  refCount++;
  if (!faithSocket.connected) {
    faithSocket.auth = { username };
    faithSocket.connect();
  }
}

export function releaseFaithChatConnection() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && faithSocket.connected) {
    faithSocket.disconnect();
  }
}

export function ensureFaithChatConnected(username) {
  if (!faithSocket.connected) {
    faithSocket.auth = { username };
    faithSocket.connect();
  }
}

export default faithSocket;
