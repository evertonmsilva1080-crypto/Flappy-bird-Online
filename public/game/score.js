import { context, sprites } from './assets.js';

export function createScore() {
  return {
    value: 0,
    addPoint() {
      this.value += 1;
    },
    draw(coinsThisRound, hudTop) {
      const coinSize = 22;
      const counterText = '$' + String(coinsThisRound).padStart(4, '0');
      context.textAlign = 'left';
      context.fillStyle = '#fff';
      context.font = '35px VT323, monospace';
      context.fillText(String(this.value).padStart(4, '0'), 10, hudTop + 62);

      context.textBaseline = 'middle';
      context.fillStyle = '#fff3a8';
      context.font = 'bold 16px "Courier New", Courier, monospace';
      context.shadowColor = '#623019';
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
      context.drawImage(sprites, 56, 8, 30, 30,
        10, hudTop, coinSize, coinSize);
      context.fillText(counterText, 10 + coinSize + 4, hudTop + coinSize / 2);
      context.shadowColor = 'transparent';
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.textBaseline = 'alphabetic';
    },
  };
}
