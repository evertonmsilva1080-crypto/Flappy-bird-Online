import { drawSkinFrame, loadSkinFrames } from './skins.js';

export function initializeStore() {
  const dialog = document.querySelector('#store-dialog');
  const openButton = document.querySelector('#store-open');
  const closeButton = document.querySelector('#store-close');
  const accountButton = document.querySelector('#account-open');
  const tabs = Array.from(dialog.querySelectorAll('[role="tab"]'));
  const wallet = document.querySelector('#store-wallet');
  const message = document.querySelector('#store-message');
  const skinGrid = document.querySelector('#store-skin-grid');
  let catalog = [];
  let currentUser = null;
  let catalogPromise;

  function closeDialog() {
    dialog.hidden = true;
    openButton.focus();
  }

  function selectTab(selectedTab) {
    tabs.forEach((tab) => {
      const selected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.querySelector('#' + tab.getAttribute('aria-controls')).hidden = !selected;
    });
  }

  async function requestApi(path, body) {
    const token = localStorage.getItem('flappy-token');
    let response;
    try {
      response = await fetch('/api/auth' + path, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new Error('Não foi possível acessar a loja. Confira se o servidor está rodando.');
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    let result = {};
    if (contentType.includes('application/json')) {
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('A API da loja retornou JSON inválido.');
      }
    } else if (response.ok) {
      throw new Error('A API da loja retornou uma resposta inesperada.');
    }

    if (!response.ok) {
      throw new Error(result.message || 'Não foi possível concluir a operação da loja.');
    }
    return result;
  }

  function updateWallet() {
    wallet.textContent = currentUser
      ? 'Saldo: ' + (currentUser.moedas || 0) + ' moedas'
      : 'Entre na sua conta para comprar skins.';
  }

  function drawPreview(canvas, skin) {
    const context = canvas.getContext('2d');
    if (!context ||
        !drawSkinFrame(context, skin.id, 0, 0, 0, canvas.width, canvas.height)) {
      throw new Error('Não foi possível exibir a prévia da skin ' + skin.name + '.');
    }
  }

  async function purchaseOrEquip(skin, button) {
    if (!currentUser) {
      message.textContent = 'Entre na sua conta para comprar skins.';
      accountButton.click();
      return;
    }

    const isOwned = currentUser.skins.includes(skin.id);
    const isEquipped = currentUser.skinEquipped === skin.id;
    if (isEquipped) return;

    button.disabled = true;
    message.textContent = isOwned ? 'Equipando ' + skin.name + '...' : 'Comprando ' + skin.name + '...';
    try {
      const result = await requestApi(
        isOwned ? '/skins/equip' : '/skins/purchase',
        { skinId: skin.id },
      );
      currentUser = result.usuario;
      window.dispatchEvent(new CustomEvent('flappy:account-updated', { detail: currentUser }));
      renderSkins();
      message.textContent = isOwned
        ? skin.name + ' equipada.'
        : skin.name + ' comprada. Ela foi salva na sua conta.';
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  }

  function renderSkins() {
    updateWallet();
    skinGrid.replaceChildren();

    catalog.forEach((skin) => {
      const ownedSkins = currentUser?.skins || [];
      const owned = ownedSkins.includes(skin.id);
      const equipped = currentUser?.skinEquipped === skin.id;
      const card = document.createElement('article');
      card.className = 'store-skin-card';

      const preview = document.createElement('canvas');
      preview.className = 'store-skin-preview';
      preview.width = 66;
      preview.height = 48;
      drawPreview(preview, skin);

      const name = document.createElement('h3');
      name.className = 'store-skin-name';
      name.textContent = skin.name;

      const price = document.createElement('p');
      price.className = 'store-skin-price';
      price.textContent = owned ? 'Adquirida' : skin.price + ' moedas';

      const action = document.createElement('button');
      action.className = 'store-skin-action';
      action.type = 'button';
      action.textContent = equipped
        ? 'Equipada'
        : owned
          ? 'Equipar'
          : currentUser
            ? 'Comprar'
            : 'Entrar';
      action.disabled = equipped;
      action.addEventListener('click', () => purchaseOrEquip(skin, action));

      card.append(preview, name, price, action);
      skinGrid.append(card);
    });
  }

  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = Promise.all([requestApi('/skins'), loadSkinFrames()])
        .then(([result]) => {
          if (!Array.isArray(result.skins)) {
            throw new Error('A API retornou um catálogo de skins inválido.');
          }
          catalog = result.skins;
          renderSkins();
          message.textContent = catalog.length + ' skins disponíveis.';
        })
        .catch((error) => {
          catalogPromise = null;
          message.textContent = error.message;
          throw error;
        });
    }
    return catalogPromise;
  }

  openButton.addEventListener('click', () => {
    dialog.hidden = false;
    closeButton.focus();
    loadCatalog().catch((error) => console.error('Falha ao carregar a loja:', error));
  });
  closeButton.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDialog();
      return;
    }

    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    tabs[nextIndex].focus();
    selectTab(tabs[nextIndex]);
  });
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tab));
  });
  window.addEventListener('flappy:account-updated', (event) => {
    currentUser = event.detail;
    renderSkins();
  });
  updateWallet();
}
