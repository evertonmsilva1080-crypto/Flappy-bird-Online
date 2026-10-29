import {
  canvas,
  context,
  sprites,
  loadMaps,
  getMapBackgroundColor,
  getMapGroundColor,
  playFallSound,
} from './assets.js';
import { createBird } from './bird.js';
import { createBirdTrail } from './particles.js';
import { createGround } from './ground.js';
import { createPipes } from './pipes.js';
import { createScore } from './score.js';
import {
  drawBackground,
  drawGameOverMedal,
  drawGameOverMessage,
  drawGameOverStats,
  drawPauseMenu,
  drawReadyMessage,
} from './background.js';
import { saveGameResult } from './account.js';

let frames = 0;
let screen = 'start';
let session;
const GAME_SPEED = 0.9;
const SIMULATION_STEP = 1000 / 60;
let simulationAccumulator = 0;
let lastFrameTimestamp;
const pauseButton = document.querySelector('#pause-toggle');
const profileButton = document.querySelector('#account-open');
const accountBar = document.querySelector('.account-bar');
const gameHud = document.querySelector('#game-hud');
const gameCoins = document.querySelector('#game-coins');
const gameScore = document.querySelector('#game-score');
const pauseOverlay = document.querySelector('#pause-overlay');
const pauseMessage = document.querySelector('#pause-message');
const pauseCountdown = document.querySelector('#pause-countdown');
const bottomNav = document.querySelector('.bottom-nav');
const homeButton = document.querySelector('#home-open');
const mapToggleButton = document.querySelector('#map-toggle');
const mapName = document.querySelector('#map-name');
const pipeExtension = document.querySelector('#pipe-extension');
const pipeExtensionContext = pipeExtension.getContext('2d');
let maps = [{ id: 'classic', name: 'Clássico' }];
let selectedMap = 'classic';
let pauseInputLockedUntil = 0;
let resumeCountdownEndsAt = 0;

function updateMapSelection() {
  const mapIndex = maps.findIndex((map) => map.id === selectedMap);
  const map = maps[mapIndex];
  mapName.textContent = `Mapa ${mapIndex + 1}`;
  mapToggleButton.setAttribute('aria-label', `Trocar mapa. Mapa atual: ${map.name}`);
  document.body.dataset.map = selectedMap;
  document.body.style.setProperty('--map-background', getMapBackgroundColor(selectedMap));
  document.body.style.setProperty('--map-ground', getMapGroundColor(selectedMap));
}

function updatePauseControls() {
  pauseButton.hidden = screen !== 'playing';
  accountBar.hidden = screen === 'playing' || screen === 'paused';
  gameHud.hidden = screen !== 'playing' && screen !== 'paused';
  pauseOverlay.hidden = screen !== 'paused';
  bottomNav.hidden = screen === 'playing' || screen === 'paused';
}

function createSession() {
  const ground = createGround();
  const score = createScore();
  const state = {
    ground,
    score,
    trail: createBirdTrail(),
    coins: 0,
    rankingPosition: null,
    finished: false,
    bird: null,
    pipes: null,
  };

  state.bird = createBird(ground, playFallSound, finishGame);
  state.pipes = createPipes(
    state.bird,
    score,
    () => { state.coins += 1; },
    finishGame,
  );
  return state;
}

function finishGame() {
  if (!session || session.finished) return;
  session.finished = true;
  session.trail.clear();
  screen = 'gameOver';
  updatePauseControls();
  const finishedSession = session;
  saveGameResult({ score: session.score.value, coins: session.coins })
    .then((result) => {
      if (session === finishedSession && result) {
        finishedSession.rankingPosition = result.posicaoRanking;
      }
    })
    .catch((error) => console.error('Falha ao salvar o resultado da partida:', error));
}

function drawGameOver() {
  drawBackground(selectedMap);
  session.ground.draw(selectedMap);
  drawGameOverMessage();
  drawGameOverMedal(session.rankingPosition, session.score.value);
  drawGameOverStats(session.score.value, session.coins);
}

function render() {
  drawBackground(selectedMap);
  gameCoins.textContent = String(session.coins).padStart(4, '0');
  gameScore.textContent = String(session.score.value).padStart(4, '0');
  updatePausePrompt();

  if (screen === 'start') {
    session.ground.draw(selectedMap);
    session.bird.draw();
    drawReadyMessage();
  } else if (screen === 'playing' || screen === 'paused') {
    session.pipes.draw(frames, selectedMap);
    session.ground.draw(selectedMap);
    if (screen === 'playing') session.trail.draw();
    session.bird.draw();
    if (screen === 'paused' && !resumeCountdownEndsAt) {
      drawPauseMenu(session.score.value, session.coins);
    }
  } else if (screen === 'gameOver') {
    drawGameOver();
  }

  function updatePausePrompt() {
    if (screen !== 'paused') {
      pauseOverlay.classList.remove('is-input-locked');
      pauseOverlay.classList.remove('is-countdown');
      pauseOverlay.setAttribute(
        'aria-label',
        'Jogo pausado. Toque em qualquer lugar para continuar.',
      );
      pauseMessage.hidden = false;
      pauseCountdown.hidden = true;
      return;
    }

    const now = Date.now();
    const isCountingDown = resumeCountdownEndsAt > 0;
    const isInputLocked = !isCountingDown && now < pauseInputLockedUntil;
    pauseOverlay.classList.toggle('is-input-locked', isInputLocked);
    pauseOverlay.classList.toggle('is-countdown', isCountingDown);
    pauseOverlay.setAttribute(
      'aria-label',
      isCountingDown
        ? 'O jogo voltará em ' + Math.max(1, Math.ceil((resumeCountdownEndsAt - now) / 1000)) + ' segundos.'
        : isInputLocked ? 'Jogo pausado. Aguarde para continuar.' : 'Jogo pausado. Toque em qualquer lugar para continuar.',
    );
    pauseMessage.hidden = isCountingDown;
    pauseCountdown.hidden = !isCountingDown;

    if (isCountingDown) {
      pauseCountdown.textContent = String(Math.max(1, Math.ceil((resumeCountdownEndsAt - now) / 1000)));
    } else {
      pauseMessage.textContent = isInputLocked ? 'Pausa ativada' : 'Toque para continuar';
    }
  }

  drawPipeExtension();
}

function drawPipeExtension() {
  const canvasBounds = canvas.getBoundingClientRect();
  const scale = canvasBounds.width / canvas.width;
  const topOffset = canvasBounds.top / scale;
  const extensionHeight = Math.ceil(topOffset);

  if (pipeExtension.width !== canvas.width) pipeExtension.width = canvas.width;
  if (pipeExtension.height !== extensionHeight) pipeExtension.height = extensionHeight;
  if (extensionHeight === 0) return;

  pipeExtensionContext.clearRect(0, 0, pipeExtension.width, pipeExtension.height);
  if (session && (screen === 'playing' || screen === 'paused')) {
    session.pipes.drawUpperOverflow(pipeExtensionContext, topOffset, selectedMap);
  }
}

function update() {
  if (screen === 'start') {
    session.ground.update();
  } else if (screen === 'playing') {
    session.pipes.update(frames);
    if (screen !== 'playing') return;
    session.ground.update();
    session.bird.update(frames);
  }
}

function loop(timestamp = performance.now()) {
  if (screen === 'paused' && resumeCountdownEndsAt && Date.now() >= resumeCountdownEndsAt) {
    screen = 'playing';
    resumeCountdownEndsAt = 0;
    pauseInputLockedUntil = 0;
    updatePauseControls();
    pauseButton.focus();
  }
  const elapsed = lastFrameTimestamp === undefined
    ? 0
    : Math.min(timestamp - lastFrameTimestamp, 100);
  lastFrameTimestamp = timestamp;

  if (screen !== 'paused') {
    simulationAccumulator += elapsed * GAME_SPEED;
    while (simulationAccumulator >= SIMULATION_STEP) {
      update();
      frames += 1;
      simulationAccumulator -= SIMULATION_STEP;
    }
    if (screen === 'playing') session.trail.update(elapsed, session.bird);
  }

  render();
  requestAnimationFrame(loop);
}

function handleGameInput() {
  if (screen === 'start') {
    frames = 0;
    screen = 'playing';
    updatePauseControls();
  } else if (screen === 'playing') {
    session.bird.jump();
  } else if (screen === 'gameOver') {
    frames = 0;
    session = createSession();
    screen = 'start';
    updatePauseControls();
  }
}

function pauseGame() {
  if (screen !== 'playing') return;
  session.trail.clear();
  screen = 'paused';
  pauseInputLockedUntil = Date.now() + 2000;
  resumeCountdownEndsAt = 0;
  updatePauseControls();
  pauseOverlay.focus();
}

function resumeGame() {
  if (screen !== 'paused' ||
      Date.now() < pauseInputLockedUntil ||
      resumeCountdownEndsAt > 0) return;
  resumeCountdownEndsAt = Date.now() + 3000;
}

export async function startGame() {
  try {
    maps = await loadMaps();
    selectedMap = maps[0].id;
    mapToggleButton.disabled = false;
  } catch (error) {
    console.error('Não foi possível carregar os mapas da pasta public/maps:', error);
    mapToggleButton.disabled = true;
    mapToggleButton.title = 'Não foi possível carregar os mapas.';
  }

  updateMapSelection();

  const start = () => {
    frames = 0;
    session = createSession();
    screen = 'start';
    updateMapSelection();
    updatePauseControls();
    loop();
  };

  if (sprites.complete && sprites.naturalWidth > 0) {
    start();
  } else {
    sprites.addEventListener('load', start, { once: true });
    sprites.addEventListener('error', () => {
      console.error('Não foi possível carregar sprites.png.');
    }, { once: true });
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handleGameInput();
  });

  pauseButton.addEventListener('click', () => {
    pauseGame();
  });

  profileButton.addEventListener('click', () => {
    pauseGame();
  });

  pauseOverlay.addEventListener('click', resumeGame);

  mapToggleButton.addEventListener('click', () => {
    if (screen === 'playing' || screen === 'paused') return;
    const currentMapIndex = maps.findIndex((map) => map.id === selectedMap);
    selectedMap = maps[(currentMapIndex + 1) % maps.length].id;
    updateMapSelection();
  });

  homeButton.addEventListener('click', () => {
    frames = 0;
    session = createSession();
    screen = 'start';
    updatePauseControls();
  });

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, select, button, [contenteditable="true"]')) {
      return;
    }
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      if (screen === 'paused') {
        resumeGame();
      } else if (screen === 'playing') {
        handleGameInput();
      }
    }
  });
}
