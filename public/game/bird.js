import { context, sprites, playJumpSound } from './assets.js';
import { drawSkinFrame, getEquippedSkin } from './skins.js';

export function createBird(ground, onFall, onGameOver) {
  return {
    spriteX: 0,
    width: 33,
    height: 24,
    x: 10,
    y: 50,
    jumpPower: 4.6,
    gravity: 0.25,
    velocity: 0,
    frame: 0,
    jump() {
      playJumpSound();
      this.velocity = -this.jumpPower;
    },
    update(frameCount) {
      if (this.y + this.height >= ground.y) {
        onFall();
        onGameOver();
        return;
      }

      this.velocity += this.gravity;
      this.y += this.velocity;
      if (frameCount % 10 === 0) this.frame = (this.frame + 1) % 4;
    },
    draw() {
      const spriteY = [0, 26, 52, 26][this.frame];
      const skinId = getEquippedSkin();
      const skinFrame = [0, 1, 2, 1][this.frame];
      if (skinId !== 'classic' &&
          drawSkinFrame(context, skinId, skinFrame, this.x, this.y, this.width, this.height)) {
        return;
      }
      context.drawImage(sprites, this.spriteX, spriteY, this.width, this.height,
        this.x, this.y, this.width, this.height);
    },
  };
}
