import { canvas, context, sprites } from './assets.js';

export function createScore() {
  return {
    value: 0,
    addPoint() {
      this.value += 1;
    },
    draw(coinsThisRound) {
      context.textAlign = 'right';
      context.fillStyle = '#fff';
      context.font = '35px VT323, monospace';
      context.fillText(String(this.value), canvas.width - 10, 35);

      const coinSize = 22;
      const counterText = '$' + String(coinsThisRound).padStart(4, '0');
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.fillStyle = '#fff3a8';
      context.font = 'bold 16px "Courier New", Courier, monospace';
      context.shadowColor = '#623019';
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
      const textWidth = context.measureText(counterText).width;
      const counterX = (canvas.width - coinSize - 4 - textWidth) / 2;
      context.drawImage(sprites, 56, 8, 30, 30,
        counterX, 5, coinSize, coinSize);
      context.fillText(counterText, counterX + coinSize + 4, 16);
      context.shadowColor = 'transparent';
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.textBaseline = 'alphabetic';
    },
  };
}
