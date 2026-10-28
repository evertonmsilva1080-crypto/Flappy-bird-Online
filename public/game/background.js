import { canvas, context, sprites } from './assets.js';

export function drawBackground() {
  context.fillStyle = '#70c5ce';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sprites, 390, 0, 275, 204, 0, canvas.height - 204, 275, 204);
  context.drawImage(sprites, 390, 0, 275, 204, 275, canvas.height - 204, 275, 204);
}

export function drawReadyMessage() {
  context.drawImage(sprites, 134, 0, 174, 152,
    (canvas.width - 174) / 2, 50, 174, 152);
}

export function drawGameOverMessage() {
  context.drawImage(sprites, 134, 153, 226, 200,
    (canvas.width - 226) / 2, 50, 226, 200);
}
