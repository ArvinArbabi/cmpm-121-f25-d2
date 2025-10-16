import "./style.css";

const root = document.createElement("div");
document.body.replaceChildren(root);

const title = document.createElement("h1");
title.textContent = "CMPM 121 — D2";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.className = "game-canvas";

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";

root.append(title, canvas, clearBtn);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.lineWidth = 4;
ctx.strokeStyle = "#000";

let drawing = false;
let drawings: { x: number; y: number }[][] = [];
let currentPath: { x: number; y: number }[] = [];

function getPos(e: MouseEvent) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top) * scaleY,
  };
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const path of drawings) {
    if (path.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }
}

canvas.addEventListener("drawing-changed", () => redraw());

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  currentPath = [];
  drawings.push(currentPath);
  const pos = getPos(e);
  currentPath.push(pos);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const pos = getPos(e);
  currentPath.push(pos);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

["mouseup", "mouseleave"].forEach((t) =>
  canvas.addEventListener(t, () => (drawing = false))
);

clearBtn.addEventListener("click", () => {
  drawings = [];
  canvas.dispatchEvent(new Event("drawing-changed"));
});
