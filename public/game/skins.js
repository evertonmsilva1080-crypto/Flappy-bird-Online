const spriteSheet = new Image();
spriteSheet.src = './skin/Folha%20de%20Sprites%20de%20P%C3%A1ssaros%20Pixelados.png';

const spriteSheetX = [38, 546, 1058];
const spriteSheetY = [24, 168, 316, 464, 616, 764, 896];
const spriteWidth = 150;
const spriteHeight = 116;
const frameBounds = new Map();
const skinSizes = new Map();
let loadingFrames;
let equippedSkin = 'classic';

export function loadSkinFrames() {
  if (!loadingFrames) {
    loadingFrames = spriteSheet.decode().then(() => {
      const canvas = document.createElement('canvas');
      canvas.width = spriteSheet.naturalWidth;
      canvas.height = spriteSheet.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Não foi possível ler a folha de sprites das skins.');

      context.drawImage(spriteSheet, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let row = 0; row < spriteSheetY.length; row += 1) {
        for (let variant = 0; variant < spriteSheetX.length; variant += 1) {
          const frames = [];
          for (let frame = 0; frame < 3; frame += 1) {
            const left = spriteSheetX[variant] + frame * spriteWidth;
            const top = spriteSheetY[row];
            let minX = left + spriteWidth;
            let minY = top + spriteHeight;
            let maxX = left - 1;
            let maxY = top - 1;

            for (let y = top; y < top + spriteHeight; y += 1) {
              for (let x = left; x < left + spriteWidth; x += 1) {
                if (pixels[(y * canvas.width + x) * 4 + 3] < 16) continue;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }

            if (maxX < minX || maxY < minY) {
              throw new Error(`Não foi possível localizar a skin da linha ${row + 1}.`);
            }
            frames.push({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
          }

          skinSizes.set(`${row}-${variant}`, {
            width: Math.max(...frames.map((bounds) => bounds.width)),
            height: Math.max(...frames.map((bounds) => bounds.height)),
          });

          for (let frame = 0; frame < frames.length; frame += 1) {
            frameBounds.set(`${row}-${variant}-${frame}`, frames[frame]);
          }
        }
      }
    });
  }
  return loadingFrames;
}

export function setEquippedSkin(skinId) {
  equippedSkin = skinId || 'classic';
  if (equippedSkin !== 'classic') {
    loadSkinFrames().catch((error) => console.error('Falha ao carregar a skin equipada:', error));
  }
}

export function getEquippedSkin() {
  return equippedSkin;
}

export function drawSkinFrame(context, skinId, frame, x, y, width, height) {
  const match = /^skin-(\d)-(\d)$/.exec(skinId);
  if (!match) return false;

  const bounds = frameBounds.get(`${match[1]}-${match[2]}-${frame}`);
  const skinSize = skinSizes.get(`${match[1]}-${match[2]}`);
  if (!bounds || !skinSize) return false;
  const scale = Math.min(width / skinSize.width, height / skinSize.height);
  const drawWidth = bounds.width * scale;
  const drawHeight = bounds.height * scale;
  context.drawImage(
    spriteSheet,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  return true;
}
