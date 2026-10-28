import { canvas, context } from './assets.js';

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
      context.textAlign = 'left';
      context.font = '18px Arial, sans-serif';
      context.fillText('Moedas: ' + coinsThisRound, 10, 28);
    },
  };
}
