// ======================================================
// 🎨 Canvas Controller – Fixed Version (Visible Strokes)
// ======================================================

export function fitCanvasToContainer(canvas) {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height); // fill background
}

export class CanvasController {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.currentStroke = null;
    this.strokes = [];
    this.undone = [];
    this.tool = 'brush';
    this.color = '#000000';
    this.width = 5;
    this.drawing = false;
  }

  // Start a new stroke
  startStroke(meta) {
    this.currentStroke = { ...meta, points: [] };
    this.drawing = true;
  }

  addPoint(point) {
    if (!this.drawing || !this.currentStroke) return;
    const pts = this.currentStroke.points;
    const ctx = this.ctx;

    if (pts.length > 0) {
      const prev = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.lineWidth = this.currentStroke.width;
      ctx.strokeStyle = this.currentStroke.color;
      ctx.globalCompositeOperation =
        this.currentStroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.stroke();
      ctx.closePath();
    }

    pts.push(point);
  }

  endStroke() {
    if (this.currentStroke) {
      this.strokes.push(this.currentStroke);
      this.currentStroke = null;
      this.drawing = false;
    }
  }

  // Redraw everything (used when syncing from server)
  redrawFromHistory(history) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const stroke of history) {
      this._drawStroke(stroke);
    }
    this.strokes = history.slice();
  }

  _drawStroke(stroke) {
    const ctx = this.ctx;
    if (!stroke.points || stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke.color;
    ctx.globalCompositeOperation =
      stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

    const pts = stroke.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.closePath();
  }

  applyRemoteStroke(stroke) {
    this._drawStroke(stroke);
    this.strokes.push(stroke);
  }
}
