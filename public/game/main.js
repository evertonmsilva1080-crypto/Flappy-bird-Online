import { canvas, context, sprites, playFallSound } from './assets.js';
import { createBird } from './bird.js';
import { createGround } from './ground.js';
import { createPipes } from './pipes.js';
import { createScore } from './score.js';
import {
  drawBackground,
  drawGameOverMedal,
  drawGameOverMessage,
  drawGameOverStats,
  drawReadyMessage,
} from './background.js';
import { saveGameResult } from './account.js';

let frames = 0;
let screen = 'start';
let session;
const pauseButton = document.querySelector('#pause-toggle');
const pauseOverlay = document.querySelector('#pause-overlay');
const resumeButton = document.querySelector('#resume-game');
const bottomNav = document.querySelector('.bottom-nav');
const pipeExtension = document.querySelector('#pipe-extension');
const pipeExtensionContext = pipeExtension.getContext('2d');

function updatePauseControls() {
  pauseButton.hidden = screen !== 'playing';
  pauseOverlay.hidden = screen !== 'paused';
  bottomNav.hidden = screen === 'playing' || screen === 'paused';
}

function createSession() {
  const ground = createGround();
  const score = createScore();
  const state = {
    ground,
    score,
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
  drawBackground();
  session.ground.draw();
  drawGameOverMessage();
  drawGameOverMedal(session.rankingPosition, session.score.value);
  drawGameOverStats(session.score.value, session.coins);
}

function render() {
  drawBackground();

  if (screen === 'start') {
    session.ground.draw();
    session.bird.draw();
    drawReadyMessage();
  } else if (screen === 'playing' || screen === 'paused') {
    session.pipes.draw(frames);
    session.ground.draw();
    session.bird.draw();
    session.score.draw(session.coins);
  } else if (screen === 'gameOver') {
    drawGameOver();
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
    session.pipes.drawUpperOverflow(pipeExtensionContext, topOffset);
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

function loop() {
  render();
  update();
  frames += 1;
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

export function startGame() {
  const start = () => {
    frames = 0;
    session = createSession();
    screen = 'start';
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
    if (screen !== 'playing') return;
    screen = 'paused';
    updatePauseControls();
    resumeButton.focus();
  });

  resumeButton.addEventListener('click', () => {
    if (screen !== 'paused') return;
    screen = 'playing';
    updatePauseControls();
    pauseButton.focus();
  });

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, select, button, [contenteditable="true"]')) {
      return;
    }
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      if (screen === 'playing') handleGameInput();
    }
  });
}
