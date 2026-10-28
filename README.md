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
- public/script.js inicializa os módulos.
- public/game/main.js controla o ciclo e as telas da partida.
- public/game/bird.js, public/game/pipes.js, public/game/ground.js e public/game/score.js contêm entidades e regras.
- public/game/assets.js e public/game/background.js cuidam de recursos visuais e sons.
- public/game/account.js cuida de cadastro, login e gravação dos resultados.

O canvas mantém a proporção do jogo e se ajusta à tela. Celulares usam toque; teclado continua disponível em computadores.

## Deploy na Vercel

O front-end está em `public/`, que a Vercel publica como arquivos estáticos. O `server.js` exporta a aplicação Express e também continua iniciando o servidor normalmente com `npm start` para desenvolvimento local. Na Vercel, a aplicação é executada como função; não há um servidor persistente.

1. Envie o repositório ao GitHub e importe-o em [vercel.com/new](https://vercel.com/new). Mantenha a raiz do projeto como diretório raiz; a Vercel detecta o Express automaticamente.
2. Em **Settings → Environment Variables**, configure `MONGODB_URI` com a URI do MongoDB Atlas e `JWT_SECRET` com uma chave aleatória de pelo menos 32 caracteres. Selecione os ambientes necessários, incluindo Production.
3. Configure no Atlas o acesso de rede apropriado para sua implantação. Não publique a URI nem a chave no repositório; `.env` e `.env.*` são ignorados pelo Git, com exceção do `.env.example`.
4. Faça o deploy (ou um novo deploy após alterar variáveis) e confira a página inicial e `/api/health`.

As conexões ao MongoDB são abertas sob demanda para as rotas da API e reutilizadas enquanto a instância da função estiver ativa. WebSockets, processos persistentes e tarefas contínuas precisam de uma hospedagem que mantenha o processo em execução.