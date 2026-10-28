export const canvas = document.querySelector('#game-canvas');
export const context = canvas.getContext('2d');

export const sprites = new Image();
sprites.src = './sprites.png';

const loadedMaps = new Map();
const backgroundColors = new Map();
const groundColors = new Map();
const backgroundColorCanvas = document.createElement('canvas');
backgroundColorCanvas.width = 1;
backgroundColorCanvas.height = 1;
const backgroundColorContext = backgroundColorCanvas.getContext('2d', { willReadFrequently: true });

function getSpriteColor(image, x, y) {
  backgroundColorContext.drawImage(image, x, y, 1, 1, 0, 0, 1, 1);
  const [red, green, blue] = backgroundColorContext.getImageData(0, 0, 1, 1).data;
  return `rgb(${red}, ${green}, ${blue})`;
}

export async function loadMaps() {
  const response = await fetch('/api/maps');
  if (!response.ok) {
    throw new Error(`Falha ao carregar mapas: HTTP ${response.status}.`);
  }

  const maps = await response.json();
  if (!Array.isArray(maps) || !maps.some((map) => map.id === 'classic')) {
    throw new Error('A pasta public/maps precisa conter o arquivo classic.png.');
  }

  await Promise.all(maps.map(async (map) => {
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(map.id) || typeof map.imageUrl !== 'string') {
      throw new Error('A lista de mapas contém um nome de arquivo inválido.');
    }

    const image = new Image();
    image.src = map.imageUrl;
    await image.decode();
    if (image.naturalWidth !== 666 || image.naturalHeight !== 722) {
      throw new Error(`${map.imageUrl} deve ter exatamente 666x722 pixels.`);
    }
    loadedMaps.set(map.id, image);
    backgroundColors.set(map.id, getSpriteColor(image, 390, 0));
    groundColors.set(map.id, getSpriteColor(image, 100, 615));
  }));

  return maps;
}

export function getMapSprites(map) {
  const image = loadedMaps.get(map);
  if (!image && map === 'classic') return sprites;
  if (!image) throw new Error(`Os sprites do mapa "${map}" não foram carregados.`);
  return image;
}

export function getMapBackgroundColor(map) {
  if (map === 'classic') return '#70c5ce';
  if (!backgroundColors.has(map)) {
    backgroundColors.set(map, getSpriteColor(getMapSprites(map), 390, 0));
  }

  if (map === 'caverna') return '#213242';
  if (!backgroundColors.has(map)) {
    backgroundColors.set(map, getSpriteColor(getMapSprites(map), 390, 0));
  }

  return backgroundColors.get(map);
}

export function getMapGroundColor(map) {
  if (!groundColors.has(map)) {
    groundColors.set(map, getSpriteColor(getMapSprites(map), 100, 615));
  }
  return groundColors.get(map);
}

const sounds = {
  hit: new Audio('./efeitos/hit.wav'),
  jump: new Audio('./efeitos/pulo.wav'),
  point: new Audio('./efeitos/ponto.wav'),
  fall: new Audio('./efeitos/caiu.wav'),
};

Object.values(sounds).forEach((sound) => { sound.preload = 'auto'; });

function playSound(sound) {
  sound.currentTime = 0;
  const playback = sound.play();
  if (playback) playback.catch(() => {});
}

export const playHitSound = () => playSound(sounds.hit);
export const playJumpSound = () => playSound(sounds.jump);
export const playPointSound = () => playSound(sounds.point);
export const playFallSound = () => playSound(sounds.fall);
