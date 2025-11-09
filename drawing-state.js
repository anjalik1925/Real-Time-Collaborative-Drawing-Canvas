// ======================================================
// 🧠 DrawingState Class - Persistent Canvas with Clear()
// ======================================================

import fs from 'fs';
import path from 'path';

export class DrawingState {
  constructor() {
    // File path to persist drawing history
    this.saveFile = path.join(process.cwd(), 'canvas.json');

    // Try loading previous session
    try {
      const data = fs.readFileSync(this.saveFile, 'utf-8');
      this.history = JSON.parse(data) || [];
      console.log(`🟢 Loaded ${this.history.length} strokes from canvas.json`);
    } catch (err) {
      this.history = [];
      console.log('⚠️ No existing canvas.json found, starting with empty canvas.');
    }

    this.redoStack = [];
    this.pending = new Map();
  }

  // -----------------------------------
  // ✏️ Stroke Management
  // -----------------------------------

  beginPendingStroke(meta) {
    this.pending.set(meta.id, { ...meta, points: [] });
  }

  appendToPending(id, pts) {
    const p = this.pending.get(id);
    if (!p) return;
    p.points.push(...pts);
  }

  endPendingStroke(id) {
    const p = this.pending.get(id);
    if (!p) return null;
    this.pending.delete(id);
    return p;
  }

  // -----------------------------------
  // 💾 Push + Save Stroke
  // -----------------------------------
  pushStroke(stroke) {
    this.history.push(stroke);
    this.redoStack = [];
    this.saveToDisk();
  }

  // -----------------------------------
  // ↩️ Undo / Redo Operations
  // -----------------------------------
  undo() {
    if (this.history.length > 0) {
      this.redoStack.push(this.history.pop());
      this.saveToDisk();
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      this.history.push(this.redoStack.pop());
      this.saveToDisk();
    }
  }

  // -----------------------------------
  // 🧹 Clear Canvas (with persistence)
  // -----------------------------------
  clear() {
    this.history = [];
    this.redoStack = [];
    this.pending = new Map();

    // Delete the canvas.json file to reset everything
    try {
      fs.unlinkSync(this.saveFile);
      console.log('🧹 Cleared canvas and removed canvas.json');
    } catch {
      console.log('ℹ️ No existing canvas.json to delete');
    }
  }

  // -----------------------------------
  // 📤 Return Copy of History
  // -----------------------------------
  getHistory() {
    return this.history.slice();
  }

  // -----------------------------------
  // 💾 Save Canvas to Disk
  // -----------------------------------
  saveToDisk() {
    try {
      fs.writeFileSync(this.saveFile, JSON.stringify(this.history, null, 2));
      console.log(`💾 Canvas saved (${this.history.length} strokes).`);
    } catch (err) {
      console.error('❌ Error saving canvas.json:', err);
    }
  }
}
