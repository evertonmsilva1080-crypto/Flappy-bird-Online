import { drawSkinFrame, loadSkinFrames } from './skins.js';
import {
  drawAccessory,
  getAccessory,
  loadAccessorySheet,
} from './accessories.js';
import { drawTrailPreview } from './particles.js';

export function initializeStore() {
  const dialog = document.querySelector('#store-dialog');
  const openButton = document.querySelector('#store-open');
  const closeButton = document.querySelector('#store-close');
  const accountButton = document.querySelector('#account-open');
  const tabs = Array.from(dialog.querySelectorAll('[role="tab"]'));
  const wallet = document.querySelector('#store-wallet');
  const message = document.querySelector('#store-message');
  const skinGrid = document.querySelector('#store-skin-grid');
  const accessoryWallet = document.querySelector('#accessory-wallet');
  const accessoryMessage = document.querySelector('#accessory-message');
  const accessoryGrid = document.querySelector('#store-accessory-grid');
  const effectWallet = document.querySelector('#effect-wallet');
  const effectMessage = document.querySelector('#effect-message');
  const effectGrid = document.querySelector('#store-effect-grid');
  let catalog = [];
  let accessories = [];
  let effects = [];
  let currentUser = null;
  let catalogPromise;
  let accessoryCatalogPromise;
  let effectCatalogPromise;

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
    if (selectedTab.id === 'store-tab-accessories') {
      loadAccessoryCatalog().catch((error) =>
        console.error('Falha ao carregar os acessórios:', error));
    }
    if (selectedTab.id === 'store-tab-effects') {
      loadEffectCatalog().catch((error) =>
        console.error('Falha ao carregar os efeitos:', error));
    }
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
    const balance = currentUser
      ? 'Saldo: ' + (currentUser.moedas || 0) + ' moedas'
      : 'Entre na sua conta para comprar itens.';
    wallet.textContent = balance;
    accessoryWallet.textContent = balance;
    effectWallet.textContent = balance;
  }

  async function purchaseOrEquipEffect(effect, button) {
    if (!currentUser) {
      effectMessage.textContent = 'Entre na sua conta para desbloquear efeitos.';
      accountButton.click();
      return;
    }

    const isOwned = effect.price === 0 || (currentUser.effects || []).includes(effect.id);
    const isEquipped = (currentUser.effectEquipped || 'effect-white') === effect.id;
    if (isEquipped) return;

    button.disabled = true;
    effectMessage.textContent = isOwned
      ? 'Equipando ' + effect.name + '...'
      : 'Desbloqueando ' + effect.name + '...';
    try {
      const result = await requestApi(
        isOwned ? '/effects/equip' : '/effects/purchase',
        { effectId: effect.id },
      );
      currentUser = result.usuario;
      window.dispatchEvent(new CustomEvent('flappy:account-updated', { detail: currentUser }));
      renderEffects();
      effectMessage.textContent = isOwned
        ? effect.name + ' equipado.'
        : effect.name + ' desbloqueado. Agora você pode equipá-lo.';
    } catch (error) {
      effectMessage.textContent = error.message;
      button.disabled = false;
    }
  }

  function renderEffects() {
    updateWallet();
    effectGrid.replaceChildren();

    effects.forEach((effect) => {
      const owned = effect.price === 0 || (currentUser?.effects || []).includes(effect.id);
      const equipped = (currentUser?.effectEquipped || 'effect-white') === effect.id;
      const card = document.createElement('article');
      card.className = 'store-skin-card';

      const preview = document.createElement('canvas');
      preview.className = 'store-skin-preview store-effect-preview';
      preview.width = 66;
      preview.height = 48;
      drawTrailPreview(preview.getContext('2d'), effect);

      const name = document.createElement('h3');
      name.className = 'store-skin-name';
      name.textContent = effect.name;

      const price = document.createElement('p');
      price.className = 'store-skin-price';
      price.textContent = effect.price === 0
        ? 'Grátis'
        : owned
          ? 'Desbloqueado'
          : effect.price + ' moedas';

      const action = document.createElement('button');
      action.className = 'store-skin-action';
      action.type = 'button';
      action.textContent = equipped
        ? 'Equipado'
        : owned
          ? 'Equipar'
          : currentUser
            ? 'Comprar'
            : 'Entrar';
      action.disabled = equipped;
      action.addEventListener('click', () => purchaseOrEquipEffect(effect, action));

      card.append(preview, name, price, action);
      effectGrid.append(card);
    });
  }

  function drawAccessoryPreview(canvas, accessory) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível exibir os acessórios.');
    drawAccessory(context, accessory, 0, 0, canvas.width, canvas.height);
  }

  function drawPreview(canvas, skin) {
    const context = canvas.getContext('2d');
    if (!context ||
        !drawSkinFrame(context, skin.id, 0, 0, 0, canvas.width, canvas.height)) {
      throw new Error('Não foi possível exibir a prévia da skin ' + skin.name + '.');
    }
  }

  async function purchaseOrEquipAccessory(accessory, button) {
    if (!currentUser) {
      accessoryMessage.textContent = 'Entre na sua conta para comprar acessórios.';
      accountButton.click();
      return;
    }

    const ownedAccessories = currentUser.accessories || [];
    const owned = accessory.id === 'none' || ownedAccessories.includes(accessory.id);
    const equipped = currentUser.accessoryEquipped === accessory.id;
    if (equipped) return;

    button.disabled = true;
    accessoryMessage.textContent = owned
      ? 'Equipando ' + accessory.name + '...'
      : 'Comprando ' + accessory.name + '...';
    try {
      const result = await requestApi(
        owned ? '/accessories/equip' : '/accessories/purchase',
        { accessoryId: accessory.id },
      );
      currentUser = result.usuario;
      window.dispatchEvent(new CustomEvent('flappy:account-updated', { detail: currentUser }));
      renderAccessories();
      accessoryMessage.textContent = accessory.id === 'none'
        ? 'Acessório removido.'
        : owned
          ? accessory.name + ' equipado.'
          : accessory.name + ' comprado e salvo na sua conta.';
    } catch (error) {
      accessoryMessage.textContent = error.message;
      button.disabled = false;
    }
  }

  function renderAccessories() {
    updateWallet();
    accessoryGrid.replaceChildren();

    const noAccessory = {
      id: 'none',
      name: 'Sem acessório',
      price: 0,
    };
    [noAccessory, ...accessories].forEach((accessory) => {
      const owned = accessory.id === 'none' ||
        (currentUser?.accessories || []).includes(accessory.id);
      const equipped = (currentUser?.accessoryEquipped || 'none') === accessory.id;
      const card = document.createElement('article');
      card.className = 'store-skin-card';

      const preview = document.createElement('canvas');
      preview.className = 'store-skin-preview';
      preview.width = 66;
      preview.height = 48;
      if (accessory.id !== 'none') drawAccessoryPreview(preview, accessory);

      const name = document.createElement('h3');
      name.className = 'store-skin-name';
      name.textContent = accessory.name;

      const price = document.createElement('p');
      price.className = 'store-skin-price';
      price.textContent = accessory.id === 'none'
        ? 'Padrão'
        : owned
          ? 'Adquirido'
          : accessory.price + ' moedas';

      const action = document.createElement('button');
      action.className = 'store-skin-action';
      action.type = 'button';
      action.textContent = equipped
        ? 'Equipado'
        : owned
          ? 'Equipar'
          : currentUser
            ? 'Comprar'
            : 'Entrar';
      action.disabled = equipped;
      action.addEventListener('click', () => purchaseOrEquipAccessory(accessory, action));

      card.append(preview, name, price, action);
      accessoryGrid.append(card);
    });
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

  function loadAccessoryCatalog() {
    if (!accessoryCatalogPromise) {
      accessoryCatalogPromise = Promise.all([
        requestApi('/accessories'),
        loadAccessorySheet(),
      ])
        .then(([result]) => {
          if (!Array.isArray(result.accessories)) {
            throw new Error('A API retornou um catálogo de acessórios inválido.');
          }
          accessories = result.accessories;
          renderAccessories();
          accessoryMessage.textContent = accessories.length + ' acessórios disponíveis.';
        })
        .catch((error) => {
          accessoryCatalogPromise = null;
          accessoryMessage.textContent = error.message;
          throw error;
        });
    }
    return accessoryCatalogPromise;
  }

  function loadEffectCatalog() {
    if (!effectCatalogPromise) {
      effectCatalogPromise = requestApi('/effects')
        .then((result) => {
          if (!Array.isArray(result.effects)) {
            throw new Error('A API retornou um catálogo de efeitos inválido.');
          }
          effects = result.effects;
          renderEffects();
          effectMessage.textContent = effects.length + ' efeitos disponíveis.';
        })
        .catch((error) => {
          effectCatalogPromise = null;
          effectMessage.textContent = error.message;
          throw error;
        });
    }
    return effectCatalogPromise;
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
    renderAccessories();
    renderEffects();
  });
  updateWallet();
}
