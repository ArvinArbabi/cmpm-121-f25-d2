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

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";

const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";

const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";

toolbar.append(thinBtn, thickBtn, clearBtn, undoBtn, redoBtn);
root.append(title, canvas, toolbar);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

let drawing = false;
let commands: DisplayCommand[] = [];
let currentCmd: MarkerLine | null = null;
const redoStack: DisplayCommand[] = [];

let currentThickness = 2;

function selectTool(btn: HTMLButtonElement, thickness: number) {
  currentThickness = thickness;
  thinBtn.classList.toggle("selectedTool", btn === thinBtn);
  thickBtn.classList.toggle("selectedTool", btn === thickBtn);
}

thinBtn.addEventListener("click", () => selectTool(thinBtn, 2));
thickBtn.addEventListener("click", () => selectTool(thickBtn, 8));
selectTool(thinBtn, 2);

function getPos(e: MouseEvent) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const cmd of commands) cmd.display(ctx);
}

canvas.addEventListener("drawing-changed", () => redraw());

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  const p = getPos(e);
  currentCmd = new MarkerLine(p, currentThickness);
  commands.push(currentCmd);
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing || !currentCmd) return;
  const p = getPos(e);
  currentCmd.drag(p.x, p.y);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

["mouseup", "mouseleave"].forEach((t) =>
  canvas.addEventListener(t, () => {
    drawing = false;
    currentCmd = null;
  })
);

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
