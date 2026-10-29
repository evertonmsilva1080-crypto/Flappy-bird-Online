import { startGame } from './game/main.js';
import { initializeAccount } from './game/account.js';
import { initializeRanking } from './game/ranking.js';
import { initializeStore } from './game/store.js';

initializeAccount();
initializeRanking();
initializeStore();
startGame();
