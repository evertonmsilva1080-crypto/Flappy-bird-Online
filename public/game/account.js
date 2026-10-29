import { setEquippedSkin } from './skins.js';
import { loadAccessorySheet, setEquippedAccessory } from './accessories.js';
import { setTrailEffect } from './particles.js';

export async function saveGameResult({ score, coins }) {
  const token = localStorage.getItem('flappy-token');
  if (!token) return null;

  const response = await fetch('/api/auth/game-result', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({ pontuacao: score, moedas: coins }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível salvar a partida.');
  }

  window.dispatchEvent(new CustomEvent('flappy:account-updated', { detail: data.usuario }));
  return data;
}

export function initializeAccount() {
  const dialog = document.querySelector('#account-dialog');
  if (!dialog) return;

  const openButton = document.querySelector('#account-open');
  const closeButton = document.querySelector('#account-close');
  const logoutButton = document.querySelector('#account-logout');
  const accountName = document.querySelector('#account-name');
  const accountStats = document.querySelector('#account-stats');
  const form = document.querySelector('#auth-form');
  const formContent = document.querySelector('#account-form-content');
  const profileContent = document.querySelector('#account-profile');
  const profileName = document.querySelector('#profile-name');
  const profileScore = document.querySelector('#profile-score');
  const profileCoins = document.querySelector('#profile-coins');
  const profileNameForm = document.querySelector('#profile-name-form');
  const profileNameInput = document.querySelector('#profile-name-input');
  const profileNameSave = document.querySelector('#profile-name-save');
  const profileNameCancel = document.querySelector('#profile-name-cancel');
  const profileEditToggle = document.querySelector('#profile-edit-toggle');
  const profileMessage = document.querySelector('#profile-message');
  const dialogTitle = document.querySelector('#auth-title');
  const message = document.querySelector('#auth-message');
  const nameInput = document.querySelector('#auth-name');
  const passwordInput = document.querySelector('#auth-password');
  const submitButton = document.querySelector('#auth-submit');
  const loginButton = document.querySelector('#show-login');
  const registerButton = document.querySelector('#show-register');
  let mode = 'login';
  let currentUser = null;

  function updateAccount(user) {
    currentUser = user;
    setEquippedSkin(user?.skinEquipped || 'classic');
    setEquippedAccessory(user?.accessoryEquipped || 'none');
    setTrailEffect(user?.effectEquipped || 'effect-white');
    if (user?.accessoryEquipped && user.accessoryEquipped !== 'none') {
      loadAccessorySheet().catch((error) =>
        console.error('Falha ao carregar o acessório equipado:', error));
    }
    accountName.textContent = user ? 'Olá, ' + user.nome : '';
    accountName.title = user ? 'ID: ' + user.id : '';
    const stats = user
      ? 'Recorde: ' + (user.pontuacaoMaxima || 0) + ' · Moedas: ' + (user.moedas || 0)
      : '';
    accountStats.textContent = stats;
    profileName.textContent = user ? user.nome : '';
    profileScore.textContent = String(user?.pontuacaoMaxima || 0);
    profileCoins.textContent = String(user?.moedas || 0);
    if (!profileNameForm || profileNameForm.hidden) {
      profileNameInput.value = user?.nome || '';
    }
    profileMessage.textContent = '';
    formContent.hidden = Boolean(user);
    profileContent.hidden = !user;
    logoutButton.hidden = !user;
    dialogTitle.textContent = user ? 'Perfil' : 'Sua conta';
    dialog.classList.toggle('is-profile', Boolean(user));
  }

  function setMode(nextMode) {
    mode = nextMode;
    const registering = mode === 'register';
    passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
    nameInput.maxLength = registering ? 15 : 60;
    submitButton.textContent = registering ? 'Criar conta' : 'Entrar';
    loginButton.setAttribute('aria-pressed', String(!registering));
    registerButton.setAttribute('aria-pressed', String(registering));
    message.textContent = '';
  }

  async function requestApi(path, options = {}) {
    let response;
    try {
      response = await fetch('/api/auth' + path, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      });
    } catch {
      throw new Error('Não foi possível acessar a API. Confira se o servidor está rodando em localhost:8000.');
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    let result = {};
    if (contentType.includes('application/json')) {
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('A API retornou JSON inválido (HTTP ' + response.status + ').');
      }
    } else if (response.ok) {
      throw new Error('A API retornou uma resposta inesperada (HTTP ' + response.status + '). Reinicie npm start.');
    }

    if (!response.ok) {
      const method = options.method || 'GET';
      const allow = response.headers.get('allow');
      const allowMessage = allow ? ' Métodos aceitos: ' + allow + '.' : '';
      throw new Error(result.message ||
        'A API respondeu com HTTP ' + response.status + ' em ' + method + ' /api/auth' + path + '.' +
        allowMessage + ' Confira o terminal do servidor.');
    }
    return result;
  }

  function openDialog(nextMode) {
    setMode(nextMode);
    dialog.hidden = false;
    nameInput.focus();
  }

  openButton.addEventListener('click', () => {
    if (currentUser) {
      dialog.hidden = false;
      closeButton.focus();
      return;
    }
    openDialog('login');
  });
  closeButton.addEventListener('click', () => {
    dialog.hidden = true;
    openButton.focus();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.hidden = true;
      openButton.focus();
    }
  });
  loginButton.addEventListener('click', () => setMode('login'));
  registerButton.addEventListener('click', () => setMode('register'));
  window.addEventListener('flappy:account-updated', (event) => updateAccount(event.detail));

  profileEditToggle.addEventListener('click', () => {
    profileNameInput.value = currentUser?.nome || '';
    profileMessage.textContent = '';
    profileNameForm.hidden = false;
    profileEditToggle.setAttribute('aria-expanded', 'true');
    profileNameInput.focus();
    profileNameInput.select();
  });

  profileNameCancel.addEventListener('click', () => {
    profileNameForm.hidden = true;
    profileEditToggle.setAttribute('aria-expanded', 'false');
    profileMessage.textContent = '';
    profileEditToggle.focus();
  });

  profileNameForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    profileNameSave.disabled = true;
    profileMessage.textContent = 'Salvando nome...';

    try {
      const token = localStorage.getItem('flappy-token');
      if (!token) throw new Error('Entre na sua conta para alterar o nome.');
      const result = await requestApi('/profile/name', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: JSON.stringify({ nome: profileNameInput.value }),
      });
      updateAccount(result.usuario);
      profileNameForm.hidden = true;
      profileEditToggle.setAttribute('aria-expanded', 'false');
      window.dispatchEvent(new CustomEvent('flappy:account-updated', { detail: result.usuario }));
      profileMessage.textContent = 'Nome atualizado.';
      profileEditToggle.focus();
    } catch (error) {
      profileMessage.textContent = error.message;
    } finally {
      profileNameSave.disabled = false;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    message.textContent = 'Aguarde...';
    const body = {
      nome: nameInput.value,
      senha: passwordInput.value,
    };

    try {
      const result = await requestApi(mode === 'register' ? '/register' : '/login', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      localStorage.setItem('flappy-token', result.token);
      updateAccount(result.usuario);
      window.dispatchEvent(new CustomEvent('flappy:account-updated', { detail: result.usuario }));
      form.reset();
      dialog.hidden = true;
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('flappy-token');
    updateAccount(null);
    window.dispatchEvent(new CustomEvent('flappy:account-updated', { detail: null }));
    dialog.hidden = true;
    openButton.focus();
  });

  const token = localStorage.getItem('flappy-token');
  if (token) {
    requestApi('/me', { headers: { Authorization: 'Bearer ' + token } })
      .then((result) => {
        updateAccount(result.usuario);
        window.dispatchEvent(new CustomEvent('flappy:account-updated', { detail: result.usuario }));
      })
      .catch(() => {
        localStorage.removeItem('flappy-token');
        updateAccount(null);
      });
  }
}
