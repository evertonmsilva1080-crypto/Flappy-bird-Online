export const canvas = document.querySelector('#game-canvas');
export const context = canvas.getContext('2d');

export const sprites = new Image();
sprites.src = './sprites.png';

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
