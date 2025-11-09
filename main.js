// ======================================================
// 🎨 CollabCanvas – Frontend Main Script
// ======================================================

import { fitCanvasToContainer, CanvasController } from './canvas.js';
import { createSocket } from './websocket.js';

// -------------------------
// 🖼️ Canvas Setup
// -------------------------
const canvas = document.getElementById('board');
fitCanvasToContainer(canvas);
window.addEventListener('resize', () => fitCanvasToContainer(canvas));

const ctrl = new CanvasController(canvas);
const ws = createSocket();

// -------------------------
// 👤 User + Room Setup
// -------------------------
const userId = Math.random().toString(36).slice(2, 9);
const userColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
let userCount = 0;

const urlParams = new URLSearchParams(window.location.search);
const roomName = urlParams.get('room') || 'main';

// -------------------------
// 🔗 WebSocket Events
// -------------------------
ws.socket.on('connect', () => ws.joinRoom(roomName, { userId, color: userColor }));
ws.socket.on('history', (history) => ctrl.redrawFromHistory(history));
ws.socket.on('stroke-append', (stroke) => ctrl.applyRemoteStroke(stroke));
ws.socket.on('history-update', (history) => ctrl.redrawFromHistory(history));
ws.socket.on('clear-canvas', () => ctrl.redrawFromHistory([]));
ws.socket.on('users', (users) => {
  userCount = users.length;
  const el = document.getElementById('userList');
  if (el) el.textContent = userCount;
});

// -------------------------
// 🖊️ Drawing Logic
// -------------------------
let drawing = false;
let sendBuffer = [];
let activeStrokeId = null;
let lastSend = 0;

function getPosition(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches && e.touches[0]) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  }
  if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  return { x: 0, y: 0 };
}

function startDrawing(e) {
  if (e.cancelable) e.preventDefault();
  if (e.pointerId && canvas.setPointerCapture) {
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
  }
  drawing = true;
  const p = { ...getPosition(e), t: Date.now() };
  activeStrokeId = Math.random().toString(36).slice(2, 9);
  const meta = {
    id: activeStrokeId,
    userId,
    tool: ctrl.tool,
    color: ctrl.color,
    width: ctrl.width,
  };
  ctrl.startStroke(meta);
  ws.sendBeginStroke(meta);
  ctrl.addPoint(p);
  sendBuffer.push(p);
  lastSend = Date.now();
}

function continueDrawing(e) {
  if (!drawing) return;
  if (e.cancelable) e.preventDefault();
  const p = { ...getPosition(e), t: Date.now() };
  ctrl.addPoint(p);
  sendBuffer.push(p);
  const now = Date.now();
  if (now - lastSend > 40) {
    ws.sendStrokePoints(activeStrokeId, sendBuffer.splice(0));
    lastSend = now;
  }
}

function stopDrawing(e) {
  if (!drawing) return;
  drawing = false;
  const p = { ...getPosition(e), t: Date.now() };
  ctrl.addPoint(p);
  if (sendBuffer.length) ws.sendStrokePoints(activeStrokeId, sendBuffer.splice(0));
  ws.sendEndStroke(activeStrokeId);
  ctrl.endStroke();
}

// -------------------------
// 🖱️ Event Listeners
// -------------------------
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', continueDrawing);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);
canvas.addEventListener('pointerleave', stopDrawing);
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', continueDrawing, { passive: false });
canvas.addEventListener('touchend', stopDrawing);

console.log('✅ Canvas listeners attached:', !!canvas, 'pointer/touch ready');

// -------------------------
// 🎛️ Toolbar Controls
// -------------------------
const colorPicker = document.getElementById('color');
const sizePicker = document.getElementById('size');
const brushBtn = document.getElementById('brush');
const eraserBtn = document.getElementById('eraser');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const clearBtn = document.getElementById('clear');
const darkModeBtn = document.getElementById('darkMode');

if (colorPicker) colorPicker.addEventListener('input', (e) => (ctrl.color = e.target.value));
if (sizePicker)
  sizePicker.addEventListener('input', (e) => (ctrl.width = parseInt(e.target.value, 10)));

function setActiveTool(tool) {
  ctrl.tool = tool;
  [brushBtn, eraserBtn].forEach((b) => b && b.classList.remove('active'));
  if (tool === 'brush' && brushBtn) brushBtn.classList.add('active');
  if (tool === 'eraser' && eraserBtn) eraserBtn.classList.add('active');
}

if (brushBtn) brushBtn.addEventListener('click', () => setActiveTool('brush'));
if (eraserBtn) eraserBtn.addEventListener('click', () => setActiveTool('eraser'));
if (undoBtn) undoBtn.addEventListener('click', () => ws.undo());
if (redoBtn) redoBtn.addEventListener('click', () => ws.redo());

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    ctrl.redrawFromHistory([]);
    try {
      ws.socket.emit('clear');
    } catch {}
  });
}

if (darkModeBtn) {
  darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const icon = darkModeBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-moon');
      icon.classList.toggle('fa-sun');
    }
  });
}

// -------------------------
// ⌨️ Keyboard Shortcuts
// -------------------------
window.addEventListener('keydown', (ev) => {
  if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA')) return;
  const key = ev.key.toLowerCase();
  if (key === 'b') setActiveTool('brush');
  if (key === 'e') setActiveTool('eraser');
  if (key === 'z') ws.undo();
  if (key === 'y') ws.redo();
  if (key === 'c') {
    ctrl.redrawFromHistory([]);
    try {
      ws.socket.emit('clear');
    } catch {}
  }
  if (key === '+' || key === '=') {
    ctrl.width = Math.min(60, ctrl.width + 1);
    if (sizePicker) sizePicker.value = ctrl.width;
  }
  if (key === '-') {
    ctrl.width = Math.max(1, ctrl.width - 1);
    if (sizePicker) sizePicker.value = ctrl.width;
  }
});

// -------------------------
// 🖱️ Real-Time Cursors
// -------------------------
const cursorContainer = document.getElementById('cursors');
const cursors = {};
let lastCursorEmit = 0;

function emitCursor(e) {
  const now = Date.now();
  if (now - lastCursorEmit < 50) return;
  lastCursorEmit = now;
  const pos = getPosition(e);
  ws.socket.emit('cursor-move', { userId, x: pos.x, y: pos.y, color: userColor });
}

canvas.addEventListener('pointermove', (e) => emitCursor(e));
canvas.addEventListener('touchmove', (e) => emitCursor(e), { passive: true });

ws.socket.on('cursor-update', ({ userId: uid, x, y, color }) => {
  if (uid === userId) return;
  let el = cursors[uid];
  if (!el) {
    el = document.createElement('div');
    el.className = 'cursor';
    el.style.background = color || '#888';
    el.innerHTML = `<span>${uid.slice(0, 3)}</span>`;
    cursorContainer.appendChild(el);
    cursors[uid] = el;
  }
  el.style.left = `${Math.max(0, Math.min(x, canvas.width))}px`;
  el.style.top = `${Math.max(0, Math.min(y, canvas.height))}px`;
});

ws.socket.on('user-left', (uid) => {
  if (cursors[uid]) {
    cursors[uid].remove();
    delete cursors[uid];
  }
});

// -------------------------
// 🚪 Disconnect Cleanup
// -------------------------
window.addEventListener('beforeunload', () => {
  try {
    ws.socket.emit('leave', { room: roomName, userId });
  } catch {}
});

setActiveTool(ctrl.tool);
