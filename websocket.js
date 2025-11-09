// ======================================================
// 🌐 WebSocket Client Helper (Socket.IO)
// ======================================================

export function createSocket() {
  // Connect automatically to your Node.js + Socket.IO server
  const socket = io();

  // ✅ Log connection status (for debugging)
  socket.on('connect', () => console.log('✅ Connected to server'));
  socket.on('disconnect', () => console.warn('⚠️ Disconnected from server'));

  // -----------------------------
  // 🎨 Drawing-related actions
  // -----------------------------
  function joinRoom(room = 'main', meta = {}) {
    socket.emit('join', { room, meta });
  }

  function sendBeginStroke(meta) {
    socket.emit('stroke-begin', meta);
  }

  function sendStrokePoints(strokeId, pointsBatch) {
    socket.emit('stroke-points', { strokeId, points: pointsBatch });
  }

  function sendEndStroke(strokeId) {
    socket.emit('stroke-end', { strokeId });
  }

  function undo() {
    socket.emit('undo');
  }

  function redo() {
    socket.emit('redo');
  }

  // Return socket + helper functions
  return {
    socket,
    joinRoom,
    sendBeginStroke,
    sendStrokePoints,
    sendEndStroke,
    undo,
    redo,
  };
}
