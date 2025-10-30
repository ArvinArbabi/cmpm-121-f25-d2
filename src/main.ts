import "./style.css";

type DisplayCommand = { display(ctx: CanvasRenderingContext2D): void };

class MarkerLine implements DisplayCommand {
  private pts: { x: number; y: number }[] = [];
  constructor(p0: { x: number; y: number }, private width: number) {
    this.pts.push(p0);
  }
  drag(x: number, y: number) {
    this.pts.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D) {
    if (this.pts.length < 2) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = this.width;
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(this.pts[0].x, this.pts[0].y);
    for (let i = 1; i < this.pts.length; i++) {
      ctx.lineTo(this.pts[i].x, this.pts[i].y);
    }
    ctx.stroke();
  }
}

class ToolPreview implements DisplayCommand {
  constructor(public x: number, public y: number, public width: number) {}
  update(x: number, y: number, width: number) {
    this.x = x;
    this.y = y;
    this.width = width;
  }
  display(ctx: CanvasRenderingContext2D) {
    const r = this.width / 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

class StickerPreview implements DisplayCommand {
  constructor(
    public x: number,
    public y: number,
    public emoji: string,
    public size: number,
  ) {}
  update(x: number, y: number, emoji: string, size: number) {
    this.x = x;
    this.y = y;
    this.emoji = emoji;
    this.size = size;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = `${this.size}px system-ui, emoji`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

class StickerCommand implements DisplayCommand {
  constructor(
    public x: number,
    public y: number,
    public emoji: string,
    public size: number,
  ) {}
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  display(ctx: CanvasRenderingContext2D) {
    ctx.font = `${this.size}px system-ui, emoji`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText(this.emoji, this.x, this.y);
  }
}

const root = document.createElement("div");
document.body.replaceChildren(root);

const title = document.createElement("h1");
title.textContent = "CMPM 121 — D2";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "game-canvas";

const toolbar = document.createElement("div");

const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";

const stickerRow = document.createElement("div");

const customBtn = document.createElement("button");
customBtn.textContent = "Custom sticker";

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";

const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";

const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";

toolbar.append(
  thinBtn,
  thickBtn,
  stickerRow,
  customBtn,
  clearBtn,
  undoBtn,
  redoBtn,
);
root.append(title, canvas, toolbar);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let drawing = false;
let commands: DisplayCommand[] = [];
let currentCmd: MarkerLine | StickerCommand | null = null;
const redoStack: DisplayCommand[] = [];

type Mode = "marker" | "sticker";
let mode: Mode = "marker";
let currentThickness = 2;

type Sticker = { emoji: string; size: number };
const stickers: Sticker[] = [
  { emoji: "💀", size: 28 },
  { emoji: "🦴", size: 28 },
  { emoji: "🔥", size: 28 },
];
let selectedSticker = 0;

let preview: ToolPreview | StickerPreview | null = new ToolPreview(
  128,
  128,
  currentThickness,
);

function selectMarker(btn: HTMLButtonElement, thickness: number) {
  mode = "marker";
  currentThickness = thickness;
  thinBtn.classList.toggle("selectedTool", btn === thinBtn);
  thickBtn.classList.toggle("selectedTool", btn === thickBtn);
  for (const b of stickerRow.querySelectorAll("button")) {
    b.classList.remove("selectedTool");
  }
  if (!drawing) {
    if (!(preview instanceof ToolPreview)) {
      preview = new ToolPreview(128, 128, currentThickness);
    } else preview.width = currentThickness;
    canvas.dispatchEvent(new Event("tool-moved"));
  }
}

function selectSticker(index: number) {
  mode = "sticker";
  selectedSticker = index;
  thinBtn.classList.remove("selectedTool");
  thickBtn.classList.remove("selectedTool");
  const buttons = stickerRow.querySelectorAll("button");
  buttons.forEach((b, i) =>
    b.classList.toggle("selectedTool", i === selectedSticker)
  );
  if (!drawing) {
    const s = stickers[selectedSticker];
    if (!(preview instanceof StickerPreview)) {
      preview = new StickerPreview(128, 128, s.emoji, s.size);
    } else preview.update(preview.x, preview.y, s.emoji, s.size);
    canvas.dispatchEvent(new Event("tool-moved"));
  }
}

function renderStickerButtons() {
  stickerRow.replaceChildren();
  stickers.forEach((s, i) => {
    const b = document.createElement("button");
    b.textContent = s.emoji;
    b.addEventListener("click", () => {
      selectSticker(i);
    });
    stickerRow.appendChild(b);
  });
  selectSticker(selectedSticker);
}

thinBtn.addEventListener("click", () => selectMarker(thinBtn, 2));
thickBtn.addEventListener("click", () => selectMarker(thickBtn, 8));

customBtn.addEventListener("click", () => {
  const text = prompt("Custom sticker text", "🧽");
  if (text && text.length > 0) {
    stickers.push({ emoji: text, size: 28 });
    selectedSticker = stickers.length - 1;
    renderStickerButtons();
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

renderStickerButtons();
selectMarker(thinBtn, 2);

function getPos(e: MouseEvent) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of commands) cmd.display(ctx);
  if (!drawing && preview) preview.display(ctx);
}

canvas.addEventListener("drawing-changed", () => redraw());
canvas.addEventListener("tool-moved", () => redraw());

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  const p = getPos(e);
  redoStack.length = 0;
  if (mode === "marker") {
    currentCmd = new MarkerLine(p, currentThickness);
    commands.push(currentCmd);
  } else {
    const s = stickers[selectedSticker];
    currentCmd = new StickerCommand(p.x, p.y, s.emoji, s.size);
    commands.push(currentCmd);
  }
  preview = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  const p = getPos(e);
  if (drawing && currentCmd) {
    currentCmd.drag(p.x, p.y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    if (mode === "marker") {
      if (!(preview instanceof ToolPreview)) {
        preview = new ToolPreview(p.x, p.y, currentThickness);
      } else preview.update(p.x, p.y, currentThickness);
    } else {
      const s = stickers[selectedSticker];
      if (!(preview instanceof StickerPreview)) {
        preview = new StickerPreview(p.x, p.y, s.emoji, s.size);
      } else preview.update(p.x, p.y, s.emoji, s.size);
    }
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});
canvas.addEventListener("mouseleave", () => {
  drawing = false;
  preview = null;
  canvas.dispatchEvent(new Event("tool-moved"));
});

clearBtn.addEventListener("click", () => {
  commands = [];
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undoBtn.addEventListener("click", () => {
  if (commands.length === 0) return;
  const popped = commands.pop()!;
  redoStack.push(popped);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const restored = redoStack.pop()!;
  commands.push(restored);
  canvas.dispatchEvent(new Event("drawing-changed"));
});
