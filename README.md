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
- As moedas podem ser usadas para comprar skins; skins compradas e a skin equipada ficam salvas na conta.
- A loja oferece acessórios que podem ser comprados, equipados e salvos na conta do jogador.
- Para ajustar cada acessório sobre o pássaro, edite o bloco `ajuste` do item correspondente em `public/accessories.json`: `posicaoX` move para a direita/esquerda, `posicaoY` para baixo/cima (em pixels do jogo), `rotacao` define o ângulo em graus e `tamanho` define a porcentagem do tamanho original (100 = padrão, 120 = 20% maior, 80 = 20% menor).
- Cada obstáculo tem duas passagens; uma delas recebe uma moeda.
- O jogador escolhe a passagem e coleta a moeda ao tocar nela.
- A barra de navegação oferece atalhos para a tela inicial, o ranking e a Loja, além de alternar entre os mapas PNG encontrados em `public/maps/`. A Loja organiza as opções de skins, acessórios e efeitos; o perfil é acessado pelo ícone de pessoa no canto superior direito.
- Ao terminar a partida, a API salva o recorde usando o maior valor e soma as moedas coletadas na conta autenticada.
- Para contas autenticadas, a tela de fim de jogo exibe uma medalha conforme a posição do recorde no ranking: dourada para 1º lugar, laranja para 2º, prata para 3º e branca para as posições seguintes com mais de um ponto.

## API
- `POST /api/auth/register`: recebe `nome` e `senha`. O nome deve ser único, sem diferenciar maiúsculas de minúsculas.
- `POST /api/auth/login`: recebe `nome` e `senha`.
- `GET /api/auth/me`: retorna os dados da conta atual.
- `GET /api/auth/skins`: retorna o catálogo de skins e seus preços.
- `POST /api/auth/skins/purchase`: recebe `skinId`, desconta o preço do saldo e registra a skin na conta autenticada.
- `POST /api/auth/skins/equip`: recebe `skinId` e salva a skin equipada na conta autenticada.
- `GET /api/auth/accessories`: retorna o catálogo de acessórios e seus preços.
- `POST /api/auth/accessories/purchase`: recebe `accessoryId`, desconta o preço e salva o acessório na conta autenticada.
- `POST /api/auth/accessories/equip`: recebe `accessoryId` e salva o acessório equipado; use `none` para remover o acessório.
- `POST /api/auth/game-result`: recebe `pontuacao` e `moedas` da partida e retorna `posicaoRanking` do recorde atualizado. Requer `Authorization: Bearer <token>`.
- `GET /api/ranking`: retorna o nome e o recorde de todos os usuários, ordenados da maior para a menor pontuação.

Na primeira inicialização após a mudança para login por nome, o servidor remove o índice de e-mail antigo e cria um índice único para os nomes. Se já houver contas com nomes repetidos, renomeie as contas duplicadas no MongoDB antes de iniciar o servidor.

## Estrutura do jogo
- public/script.js inicializa os módulos.
- public/game/main.js controla o ciclo e as telas da partida.
- public/game/bird.js, public/game/pipes.js, public/game/ground.js e public/game/score.js contêm entidades e regras.
- public/game/assets.js e public/game/background.js cuidam de recursos visuais e sons.
- public/game/skins.js recorta e exibe as skins da folha de sprites.
- public/game/accessories.js recorta os acessórios e os desenha sobre o pássaro.
- public/game/account.js cuida de cadastro, login e gravação dos resultados.
- public/game/ranking.js carrega e exibe o ranking público de jogadores.

## Estrutura do servidor
- server.js configura o Express, registra as rotas e inicia o servidor local.
- config/database.js gerencia a conexão ao MongoDB e executa a migração de índices.
- routes/ contém endpoints separados para autenticação, ranking e mapas.
- models/ define o esquema do usuário e regras compartilhadas para nomes.
- migrations/ guarda migrações de banco que podem ser executadas na inicialização.
- middleware/ contém etapas reutilizáveis do ciclo de requisição, como a preparação do banco.

O canvas mantém a proporção do jogo e se ajusta à tela. Celulares usam toque; teclado continua disponível em computadores.

## Adicionar mapas

Os mapas ficam em `public/maps/`. Para adicionar um, coloque nessa pasta um arquivo PNG com nome em letras minúsculas, números, hífens ou sublinhados, por exemplo `floresta.png`. O jogo descobre os arquivos automaticamente ao carregar; não é necessário editar o código. O nome exibido é derivado do nome do arquivo. O mapa atualiza ao recarregar a página.

Cada arquivo deve ser um atlas completo de **666 x 722 pixels**, no mesmo formato de `classic.png`, `city.png` e `night.png`:
- Cenário: posição `(390, 0)`, tamanho `275 x 204`.
- Canos: sprites nas posições originais do atlas, começando em `(0, 169)` e `(52, 169)`.
- Piso: posição `(0, 610)`, tamanho `224 x 112`.

Mantenha `classic.png` na pasta: ele é o mapa padrão e também serve como referência do formato. As imagens dos mapas podem variar no cenário, nos canos e no piso; pássaro, moedas e elementos da interface continuam usando `sprites.png`. Adicione a imagem ao repositório e publique um novo deploy para disponibilizá-la no site.

## Deploy na Vercel

O front-end está em `public/`, que a Vercel publica como arquivos estáticos. O `server.js` exporta a aplicação Express e também continua iniciando o servidor normalmente com `npm start` para desenvolvimento local. Na Vercel, a aplicação é executada como função; não há um servidor persistente.

1. Envie o repositório ao GitHub e importe-o em [vercel.com/new](https://vercel.com/new). Mantenha a raiz do projeto como diretório raiz; a Vercel detecta o Express automaticamente.
2. Em **Settings → Environment Variables**, configure `MONGODB_URI` com a URI do MongoDB Atlas e `JWT_SECRET` com uma chave aleatória de pelo menos 32 caracteres. Selecione os ambientes necessários, incluindo Production.
3. Configure no Atlas o acesso de rede apropriado para sua implantação. Não publique a URI nem a chave no repositório; `.env` e `.env.*` são ignorados pelo Git, com exceção do `.env.example`.
4. Faça o deploy (ou um novo deploy após alterar variáveis) e confira a página inicial e `/api/health`.

As conexões ao MongoDB são abertas sob demanda para as rotas da API e reutilizadas enquanto a instância da função estiver ativa. WebSockets, processos persistentes e tarefas contínuas precisam de uma hospedagem que mantenha o processo em execução.
