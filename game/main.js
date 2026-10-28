import { canvas, context, sprites, playFallSound } from './assets.js';
import { createBird } from './bird.js';
import { createGround } from './ground.js';
import { createPipes } from './pipes.js';
import { createScore } from './score.js';
import { drawBackground, drawGameOverMessage, drawReadyMessage } from './background.js';
import { saveGameResult } from './account.js';

let frames = 0;
let screen = 'start';
let session;

function createSession() {
  const ground = createGround();
  const score = createScore();
  const state = {
    ground,
    score,
    coins: 0,
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
  saveGameResult({ score: session.score.value, coins: session.coins })
    .catch((error) => console.error('Falha ao salvar o resultado da partida:', error));
}

function drawGameOver() {
  drawBackground();
  session.ground.draw();
  drawGameOverMessage();
  context.textAlign = 'center';
  context.fillStyle = '#fff';
  context.font = 'bold 22px Arial, sans-serif';
  context.fillText('Pontuação: ' + session.score.value, canvas.width / 2, 280);
  context.font = '18px Arial, sans-serif';
  context.fillText('Moedas coletadas: ' + session.coins, canvas.width / 2, 310);
}

function render() {
  drawBackground();

  if (screen === 'start') {
    session.ground.draw();
    session.bird.draw();
    drawReadyMessage();
  } else if (screen === 'playing') {
    session.pipes.draw();
    session.ground.draw();
    session.bird.draw();
    session.score.draw(session.coins);
  } else {
    drawGameOver();
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
  } else if (screen === 'playing') {
    session.bird.jump();
  } else {
    frames = 0;
    session = createSession();
    screen = 'start';
  }
}

export function startGame() {
  const start = () => {
    frames = 0;
    session = createSession();
    screen = 'start';
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
