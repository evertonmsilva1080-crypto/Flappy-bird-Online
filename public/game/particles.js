import { context } from './assets.js';

const PARTICLE_CAPACITY = 18;
const EMISSION_INTERVAL_MS = 55;
const WHITE_EFFECT = 'effect-white';
const RAINBOW_COLORS = ['#ff595e', '#ff9f43', '#fff078', '#67cc69', '#55b6f9', '#a46de0'];
const EFFECT_COLORS = {
  'effect-white': ['#ffffff'],
  'effect-red': ['#ff595e', '#c9182b'],
  'effect-blue': ['#73d2ff', '#2878d0'],
  'effect-green': ['#9be564', '#3b9b50'],
  'effect-purple': ['#d49aff', '#8450c8'],
  'effect-yellow': ['#fff078', '#f4a91d'],
  'effect-pink': ['#ff9fcf', '#e34f9b'],
  'effect-cyan': ['#8ffff0', '#31bcb8'],
  'effect-gold': ['#ffe38b', '#d99b2b'],
  'effect-stars': ['#fff3a8', '#ffffff'],
  'effect-rainbow': RAINBOW_COLORS,
};
let equippedEffect = WHITE_EFFECT;

export function setTrailEffect(effectId) {
  equippedEffect = Object.hasOwn(EFFECT_COLORS, effectId) ? effectId : WHITE_EFFECT;
}

export function drawTrailPreview(renderContext, effect) {
  const colors = effect.colors;
  const points = [
    [13, 23], [20, 17], [25, 28], [31, 21], [38, 15], [44, 27], [50, 20],
  ];
  renderContext.save();
  points.forEach(([x, y], index) => {
    renderContext.fillStyle = colors[index % colors.length];
    if (effect.type === 'stars') {
      renderContext.fillRect(x + 2, y, 2, 6);
      renderContext.fillRect(x, y + 2, 6, 2);
      renderContext.fillRect(x + 2, y + 2, 2, 2);
    } else {
      renderContext.fillRect(x, y, 4, 4);
    }
  });
  renderContext.restore();
}

export function createBirdTrail(renderContext = context) {
  const particles = Array.from({ length: PARTICLE_CAPACITY }, () => ({
    active: false,
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    size: 0,
    life: 0,
    maxLife: 0,
    color: '#ffffff',
  }));
  let nextParticle = 0;
  let emissionTimer = 0;
  let rainbowColorIndex = 0;

  function emit(bird) {
    const particle = particles[nextParticle];
    nextParticle = (nextParticle + 1) % particles.length;

    particle.active = true;
    particle.x = bird.x + 1;
    particle.y = bird.y + bird.height * (0.25 + Math.random() * 0.5);
    particle.velocityX = -(38 + Math.random() * 42);
    particle.velocityY = (Math.random() - 0.5) * 34;
    particle.size = 2 + Math.floor(Math.random() * 4);
    particle.life = 0.2 + Math.random() * 0.18;
    particle.maxLife = particle.life;
    particle.shape = equippedEffect === 'effect-stars' ? 'star' : 'square';
    const colors = equippedEffect === 'effect-rainbow'
      ? RAINBOW_COLORS
      : EFFECT_COLORS[equippedEffect] || EFFECT_COLORS[WHITE_EFFECT];
    particle.color = equippedEffect === 'effect-rainbow'
      ? colors[rainbowColorIndex++ % colors.length]
      : colors[Math.floor(Math.random() * colors.length)];
  }

  return {
    update(deltaMs, bird) {
      const deltaSeconds = deltaMs / 1000;
      emissionTimer += deltaMs;

      while (emissionTimer >= EMISSION_INTERVAL_MS) {
        emissionTimer -= EMISSION_INTERVAL_MS;
        emit(bird);
      }

      for (const particle of particles) {
        if (!particle.active) continue;

        particle.life -= deltaSeconds;
        if (particle.life <= 0) {
          particle.active = false;
          continue;
        }

        particle.x += particle.velocityX * deltaSeconds;
        particle.y += particle.velocityY * deltaSeconds;
        particle.velocityY += 8 * deltaSeconds;
      }
    },

    draw() {
      renderContext.save();
      for (const particle of particles) {
        if (!particle.active) continue;

        renderContext.globalAlpha = particle.life / particle.maxLife;
        renderContext.fillStyle = particle.color;
        const x = Math.round(particle.x);
        const y = Math.round(particle.y);
        if (particle.shape === 'star') {
          const unit = Math.max(1, Math.floor(particle.size / 3));
          renderContext.fillRect(x + unit, y, unit, unit);
          renderContext.fillRect(x, y + unit, unit, unit);
          renderContext.fillRect(x + unit, y + unit, unit, unit);
          renderContext.fillRect(x + unit * 2, y + unit, unit, unit);
          renderContext.fillRect(x + unit, y + unit * 2, unit, unit);
        } else {
          renderContext.fillRect(x, y, particle.size, particle.size);
        }
      }
      renderContext.restore();
    },

    clear() {
      for (const particle of particles) particle.active = false;
      emissionTimer = 0;
      nextParticle = 0;
      rainbowColorIndex = 0;
    },
  };
}
