import { canvas, context, sprites, playHitSound, playPointSound } from './assets.js';

const coinFrames = [
  { x: 134, width: 13 },
  { x: 151, width: 18 },
  { x: 173, width: 29 },
  { x: 206, width: 30 },
  { x: 240, width: 29 },
  { x: 272, width: 19 },
  { x: 295, width: 13 },
];
const coinFrameHeight = 30;
const coinFrameDuration = 5;

export function createPipes(bird, score, onCollectCoin, onGameOver) {
  const pipes = {
    width: 52,
    height: 400,
    capHeight: 26,
    coinRadius: 10,
    singleGapHeight: 108,
    doubleGapHeight: 84,
    dividerHeight: 52,
    spriteY: 169,
    groundSpriteX: 0,
    skySpriteX: 52,
    pairs: [],

    drawBody(x, y, height, spriteX, sourceY = this.spriteY + this.capHeight, targetContext = context) {
      if (height <= 0) return;
      targetContext.drawImage(sprites, spriteX, sourceY, this.width,
        this.height - this.capHeight, x, y, this.width, height);
    },

    drawUpperPipe(x, bottomY, targetContext = context, offsetY = 0) {
      const bodyHeight = this.height - this.capHeight;
      this.drawBody(x, bottomY - this.height + offsetY, bodyHeight, this.skySpriteX,
        this.spriteY, targetContext);
      targetContext.drawImage(sprites, this.skySpriteX,
        this.spriteY + this.height - this.capHeight,
        this.width, this.capHeight, x, bottomY - this.capHeight + offsetY,
        this.width, this.capHeight);
    },

    drawUpperOverflow(targetContext, offsetY) {
      this.pairs.forEach((pair) => {
        this.drawUpperPipe(pair.x, pair.passages[0].y, targetContext, offsetY);
      });
    },

    drawLowerPipe(x, topY) {
      context.drawImage(sprites, this.groundSpriteX, this.spriteY,
        this.width, this.capHeight, x, topY, this.width, this.capHeight);
      this.drawBody(x, topY + this.capHeight,
        this.height - this.capHeight, this.groundSpriteX);
    },

    drawDivider(x, topY, bottomY) {
      const bodyTop = topY + this.capHeight;
      const bodyBottom = bottomY - this.capHeight;
      context.drawImage(sprites, this.groundSpriteX, this.spriteY,
        this.width, this.capHeight, x, topY, this.width, this.capHeight);
      this.drawBody(x, bodyTop, bodyBottom - bodyTop, this.groundSpriteX);
      context.drawImage(sprites, this.skySpriteX,
        this.spriteY + this.height - this.capHeight,
        this.width, this.capHeight, x, bodyBottom, this.width, this.capHeight);
    },

    drawCoin(coin, frameCount = 0) {
      const frameIndex = Math.floor(frameCount / coinFrameDuration) % coinFrames.length;
      const frame = coinFrames[frameIndex];
      context.drawImage(
        sprites,
        frame.x,
        541,
        frame.width,
        coinFrameHeight,
        coin.x - frame.width / 2,
        coin.y - coinFrameHeight / 2,
        frame.width,
        coinFrameHeight,
      );
    },

    draw(frameCount = 0) {
      this.pairs.forEach((pair) => {
        const firstGap = pair.passages[0];
        const lastGap = pair.passages[pair.passages.length - 1];
        this.drawUpperPipe(pair.x, firstGap.y);

        if (pair.passages.length === 2) {
          this.drawDivider(pair.x, firstGap.y + firstGap.height, pair.passages[1].y);
        }

        this.drawLowerPipe(pair.x, lastGap.y + lastGap.height);
        if (pair.coin && !pair.coin.collected) this.drawCoin(pair.coin, frameCount);
      });
    },

    collides(pair) {
      const birdRight = bird.x + bird.width;
      const birdBottom = bird.y + bird.height;
      if (birdRight <= pair.x || bird.x >= pair.x + this.width) return false;

      const fitsGap = (gap) => bird.y >= gap.y && birdBottom <= gap.y + gap.height;
      return !pair.passages.some(fitsGap);
    },

    collect(pair) {
      const coin = pair.coin;
      if (!coin || coin.collected) return;

      const closestX = Math.max(bird.x, Math.min(coin.x, bird.x + bird.width));
      const closestY = Math.max(bird.y, Math.min(coin.y, bird.y + bird.height));
      const dx = coin.x - closestX;
      const dy = coin.y - closestY;
      if (dx * dx + dy * dy <= this.coinRadius * this.coinRadius) {
        coin.collected = true;
        playPointSound();
        onCollectCoin();
      }
    },

    createPair() {
      const hasTwoPassages = Math.random() < 0.35;
      const gapHeight = hasTwoPassages ? this.doubleGapHeight : this.singleGapHeight;
      const firstGapY = hasTwoPassages
        ? 30 + Math.random() * 32
        : 70 + Math.random() * 110;
      const passages = [{ y: firstGapY, height: gapHeight }];

      if (hasTwoPassages) {
        passages.push({
          y: firstGapY + gapHeight + this.dividerHeight,
          height: gapHeight,
        });
      }

      const coinPassage = hasTwoPassages
        ? passages[Math.floor(Math.random() * passages.length)]
        : null;

      return {
        x: canvas.width,
        passages,
        coin: coinPassage ? {
          x: canvas.width + this.width / 2,
          y: coinPassage.y + coinPassage.height / 2,
          collected: false,
        } : null,
        scored: false,
      };
    },

    update(frameCount) {
      if (frameCount % 115 === 0) this.pairs.push(this.createPair());

      this.pairs.forEach((pair) => {
        if (pair.ended) return;
        pair.x -= 2;
        if (pair.coin) pair.coin.x = pair.x + this.width / 2;

        if (this.collides(pair)) {
          pair.ended = true;
          playHitSound();
          onGameOver();
          return;
        }

        this.collect(pair);
        if (!pair.scored && pair.x + this.width < bird.x) {
          pair.scored = true;
          score.addPoint();
        }
      });

      this.pairs = this.pairs.filter((pair) => pair.x + this.width > 0);
    },
  };

  return pipes;
}
