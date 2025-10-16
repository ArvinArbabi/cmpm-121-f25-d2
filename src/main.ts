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

function getPos(e: MouseEvent) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top) * scaleY,
  };
}

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getPos(e);
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(x, y);
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const { x, y } = getPos(e);
  ctx.lineTo(x, y);
  ctx.stroke();
});

["mouseup", "mouseleave"].forEach((t) =>
  canvas.addEventListener(t, () => (drawing = false))
);

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
