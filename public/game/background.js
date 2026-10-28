import {
  canvas,
  context,
  sprites,
  getMapSprites,
  getMapBackgroundColor,
} from './assets.js';

export function drawBackground(map) {
  const mapSprites = getMapSprites(map);
  context.fillStyle = getMapBackgroundColor(map);
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(mapSprites, 390, 0, 275, 204, 0, canvas.height - 204, 275, 204);
  context.drawImage(mapSprites, 390, 0, 275, 204, 275, canvas.height - 204, 275, 204);
}

export function drawReadyMessage() {
  context.drawImage(sprites, 134, 0, 174, 152,
    (canvas.width - 174) / 2, 50, 174, 152);
}

export function drawGameOverMessage() {
  context.drawImage(sprites, 134, 153, 226, 200,
    (canvas.width - 226) / 2, 50, 226, 200);
}

export function drawGameOverStats(score, coins) {
  const scoreText = String(score).padStart(4, '0');
  const coinsText = String(coins).padStart(4, '0');

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#c65300';
  context.font = 'bold 12px "Courier New", Courier, monospace';
  context.shadowColor = '#fff3a8';
  context.shadowOffsetX = 1;
  context.shadowOffsetY = 1;
  context.fillText(scoreText, 228, 126);
  context.fillText(coinsText, 228, 166);
  context.shadowColor = 'transparent';
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.textBaseline = 'alphabetic';
}

export function drawGameOverMedal(rankingPosition, score) {
  let spriteX;
  let spriteY;

  if (rankingPosition === 1) {
    spriteX = 0;
    spriteY = 123;
  } else if (rankingPosition === 2) {
    spriteX = 45;
    spriteY = 123;
  } else if (rankingPosition === 3) {
    spriteX = 45;
    spriteY = 78;
  } else if (rankingPosition > 3 && score > 1) {
    spriteX = 0;
    spriteY = 78;
  } else {
    return;
  }

  context.drawImage(
    sprites,
    spriteX,
    spriteY,
    45,
    45,
    (canvas.width - 226) / 2 + 25,
    132,
    42,
    42,
  );
}
