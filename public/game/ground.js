import { canvas, context, getMapSprites } from './assets.js';

export function createGround() {
  const ground = {
    spriteX: 0,
    spriteY: 610,
    width: 224,
    height: 112,
    x: 0,
    y: canvas.height - 112 + 20,
    update() {
      const repeatWidth = this.width / 2;
      this.x = (this.x - 1) % repeatWidth;
    },
    draw(map = 'classic') {
      const mapSprites = getMapSprites(map);
      context.drawImage(mapSprites, this.spriteX, this.spriteY, this.width, this.height,
        this.x, this.y, this.width, this.height);
      context.drawImage(mapSprites, this.spriteX, this.spriteY, this.width, this.height,
        this.x + this.width, this.y, this.width, this.height);
    },
  };

  return ground;
}
