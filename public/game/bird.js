import { context, sprites, playJumpSound } from './assets.js';
import { drawSkinFrame, getEquippedSkin } from './skins.js';
import {
  drawAccessoryOnBird,
  getAccessory,
  getEquippedAccessory,
} from './accessories.js';

export function createBird(ground, onFall, onGameOver) {
  const visualOffsetX = 6;

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
      const visualX = this.x + visualOffsetX;
      const skinId = getEquippedSkin();
      const skinFrame = [0, 1, 2, 1][this.frame];
      const drewSkin = skinId !== 'classic' &&
        drawSkinFrame(context, skinId, skinFrame, visualX, this.y, this.width, this.height);
      if (!drewSkin) {
        context.drawImage(sprites, this.spriteX, spriteY, this.width, this.height,
          visualX, this.y, this.width, this.height);
      }

      const accessoryId = getEquippedAccessory();
      if (accessoryId !== 'none') {
        const accessory = getAccessory(accessoryId);
        if (accessory) drawAccessoryOnBird(context, accessory, this, visualOffsetX);
      }
    },
  };
}
