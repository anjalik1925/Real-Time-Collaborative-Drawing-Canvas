// ======================================================
// 🚀 Real-Time Collaborative Canvas Server (Final Fixed)
// ======================================================

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { DrawingState } from './drawing-state.js';
import path from 'path';
import { fileURLToPath } from 'url';

// -------------------------
// 🧭 Path Setup
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------
// ⚙️ Express + Socket.IO Setup
// -------------------------
const app = express();
const server = http.createServer(app);

// ✅ Serve static frontend files
app.use(express.static(path.join(__dirname, '../client')));

// ✅ Optional but recommended: handle root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ✅ No need for CORS when frontend + backend on same origin
const io = new Server(server);

// -------------------------
// 🧠 Drawing State Manager
// -------------------------
const drawing = new DrawingState();

// -------------------------
// 🔌 WebSocket Connection Logic
// -------------------------
io.on('connection', (socket) => {
  console.log(`🟢 New client connected: ${socket.id}`);

  // ----------- User Joins Room -----------
  socket.on('join', ({ room = 'main', meta }) => {
    socket.join(room);
    socket.data.meta = meta || {};

    // Send full drawing history to new user
    socket.emit('history', drawing.getHistory());

    // Broadcast current active users
    const users = Array.from(io.sockets.adapter.rooms.get(room) || []);
    io.in(room).emit('users', users);

    console.log(`👤 User joined room: ${room}`, meta);
  });

  // ----------- Drawing Events -----------
  socket.on('stroke-begin', (meta) => {
    drawing.beginPendingStroke(meta);
  });

  socket.on('stroke-points', ({ strokeId, points }) => {
    drawing.appendToPending(strokeId, points);
  });

  socket.on('stroke-end', ({ strokeId }) => {
    const stroke = drawing.endPendingStroke(strokeId);
    if (stroke) {
      drawing.pushStroke(stroke);
      io.emit('stroke-append', stroke);
    }
  });

  // ----------- Undo / Redo -----------
  socket.on('undo', () => {
    drawing.undo();
    io.emit('history-update', drawing.getHistory());
  });

  socket.on('redo', () => {
    drawing.redo();
    io.emit('history-update', drawing.getHistory());
  });

  // ----------- Clear Canvas -----------
  socket.on('clear', () => {
    drawing.clear();
    io.emit('clear-canvas');
    console.log('🧹 Canvas cleared by user.');
  });

  // ----------- Cursor Broadcasting -----------
  socket.on('cursor-move', (data) => {
    socket.broadcast.emit('cursor-update', data);
  });

  // ----------- User Disconnect -----------
  socket.on('disconnect', () => {
    const meta = socket.data.meta;
    if (meta?.userId) {
      console.log(`🔴 User disconnected: ${meta.userId}`);
      io.emit('user-left', meta.userId);
    }
  });
});

// -------------------------
// 🟢 Start Server
// -------------------------
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
