export function initializeRanking() {
  const dialog = document.querySelector('#ranking-dialog');
  const openButton = document.querySelector('#ranking-open');
  const closeButton = document.querySelector('#ranking-close');
  const message = document.querySelector('#ranking-message');
  const list = document.querySelector('#ranking-list');

  function closeDialog() {
    dialog.hidden = true;
    openButton.focus();
  }

  async function loadRanking() {
    message.textContent = 'Carregando ranking...';
    list.replaceChildren();

    try {
      const response = await fetch('/api/ranking');
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Não foi possível carregar o ranking.');
      }

      if (!Array.isArray(result.ranking)) {
        throw new Error('A API retornou um ranking inválido.');
      }
      if (result.ranking.length === 0) {
        message.textContent = 'Ainda não há jogadores no ranking.';
        return;
      }

      const rows = document.createDocumentFragment();
      result.ranking.forEach((player, index) => {
        const row = document.createElement('tr');
        const place = document.createElement('td');
        const name = document.createElement('td');
        const score = document.createElement('td');
        place.textContent = String(index + 1);
        name.textContent = String(player.nome);
        score.textContent = String(player.pontuacao);
        row.append(place, name, score);
        rows.append(row);
      });
      list.append(rows);
      message.textContent = result.ranking.length + ' jogadores';
    } catch (error) {
      message.textContent = error.message || 'Não foi possível carregar o ranking.';
    }
  }

  openButton.addEventListener('click', () => {
    dialog.hidden = false;
    loadRanking();
    closeButton.focus();
  });
  closeButton.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDialog();
  });
}
