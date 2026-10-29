const accessorySheet = new Image();
accessorySheet.src = './acess%C3%B3rios/acessorios.png';

let equippedAccessory = 'none';
let accessoryCatalog;
let loadingCatalog;

async function loadAccessoryCatalog() {
  if (!loadingCatalog) {
    loadingCatalog = fetch('./accessories.json')
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar o catálogo de acessórios.');
        return response.json();
      })
      .then((result) => {
        if (!Array.isArray(result)) throw new Error('O catálogo de acessórios é inválido.');
        accessoryCatalog = result;
      })
      .catch((error) => {
        loadingCatalog = null;
        throw error;
      });
  }
  return loadingCatalog;
}

export function loadAccessorySheet() {
  return Promise.all([accessorySheet.decode(), loadAccessoryCatalog()]);
}

export function setEquippedAccessory(accessoryId) {
  equippedAccessory = accessoryId || 'none';
}

export function getEquippedAccessory() {
  return equippedAccessory;
}

export function getAccessory(accessoryId) {
  return accessoryCatalog?.find((accessory) => accessory.id === accessoryId);
}

export function drawAccessory(context, accessory, x, y, width, height) {
  const scale = Math.min(width / accessory.width, height / accessory.height);
  const drawWidth = accessory.width * scale;
  const drawHeight = accessory.height * scale;
  context.drawImage(accessorySheet, accessory.x, accessory.y, accessory.width, accessory.height,
    x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

export function drawAccessoryOnBird(context, accessory, bird, deslocamentoX = 0) {
  const ajuste = accessory.ajuste ?? {};
  const maxWidth = bird.width + 4;
  const maxHeight = bird.height;
  const tamanho = (ajuste.tamanho ?? 100) / 100;
  const scale = Math.min(maxWidth / accessory.width, maxHeight / accessory.height) * tamanho;
  const drawWidth = accessory.width * scale;
  const drawHeight = accessory.height * scale;
  const centroX = bird.x + bird.width / 2 + deslocamentoX + (ajuste.posicaoX ?? 0);
  const centroY = bird.y - drawHeight / 2 + 2 + (ajuste.posicaoY ?? 0);

  context.save();
  context.translate(centroX, centroY);
  context.rotate(((ajuste.rotacao ?? 0) * Math.PI) / 180);
  context.drawImage(
    accessorySheet,
    accessory.x,
    accessory.y,
    accessory.width,
    accessory.height,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  context.restore();
}
