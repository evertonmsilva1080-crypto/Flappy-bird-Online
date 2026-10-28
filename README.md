# Flappy Bird com contas de usuário

## Pré-requisitos
- Node.js instalado
- Uma instância MongoDB (local ou MongoDB Atlas)

## Configuração
1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env`.
3. Preencha `MONGODB_URI` com a conexão do seu banco e defina um `JWT_SECRET` com pelo menos 32 caracteres.
4. Inicie com `npm start`.
5. Abra http://localhost:8000 no navegador.

O Express serve o jogo e a API no mesmo endereço. Não abra o `index.html` diretamente, porque cadastro, login e gravação das partidas precisam da API.

## Funcionalidades
- Cadastro e login de usuários.
- Cada usuário tem um ID do MongoDB, recorde pessoal e saldo de moedas.
- Cada obstáculo tem duas passagens; uma delas recebe uma moeda.
- O jogador escolhe a passagem e coleta a moeda ao tocar nela.
- Ao terminar a partida, a API salva o recorde usando o maior valor e soma as moedas coletadas na conta autenticada.

## API
- `POST /api/auth/register`: recebe `nome`, `email` e `senha`.
- `POST /api/auth/login`: recebe `email` e `senha`.
- `GET /api/auth/me`: retorna os dados da conta atual.
- `POST /api/auth/game-result`: recebe `pontuacao` e `moedas` da partida. Requer `Authorization: Bearer <token>`.

## Estrutura do jogo
- script.js inicializa os módulos.
- game/main.js controla o ciclo e as telas da partida.
- game/bird.js, game/pipes.js, game/ground.js e game/score.js contêm entidades e regras.
- game/assets.js e game/background.js cuidam de recursos visuais e sons.
- game/account.js cuida de cadastro, login e gravação dos resultados.

O canvas mantém a proporção do jogo e se ajusta à tela. Celulares usam toque; teclado continua disponível em computadores.