import { startGame } from './game/main.js';
import { initializeAccount } from './game/account.js';
import { initializeRanking } from './game/ranking.js';

initializeAccount();
initializeRanking();
startGame();
