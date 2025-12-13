/** @type {string} Clave usada para persistir el carrito en storage. */
const CART_KEY = 'hecho_capriccio_cart';

/** @type {string} Número de WhatsApp al que se envían los pedidos. */
const WHATSAPP_PHONE = '50240769591';

/** @type {Set<string>} Listado de productos que requieren preventa. */
const PREORDER_ITEMS = new Set([
  'Nutella Oreo (Rosca Roll 12 porciones)',
  'Frutilla (Rosca Roll 12 porciones)',
]);

/** @type {string} Nota que se adjunta cuando hay productos de preventa. */
const PREORDER_NOTE =
  'Nota: los sabores Nutella Oreo y Frutilla solo están disponibles como Rosca Roll de 12 porciones para entrega el 23 o 24 de diciembre, bajo pedido. Indica tu fecha preferida.';

/**
 * Devuelve el storage a usar, priorizando el provisto o `localStorage` cuando exista.
 * @param {Storage} [storage] Storage opcional para pruebas.
 * @returns {Storage|undefined} Storage disponible o `undefined` si no hay.
 */
function safeStorage(storage) {
  if (storage) return storage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return undefined;
}

/**
 * Normaliza y filtra un array de items para evitar valores inesperados.
 * @param {unknown} value Valor a normalizar.
 * @returns {Array<{name: string, qty: number}>}
 */
function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const name = typeof item.name === 'string' ? item.name : '';
      const qty = Number.isFinite(Number(item.qty)) ? Math.max(Number(item.qty), 0) : 0;
      return { name, qty };
    })
    .filter((item) => item.name && item.qty > 0);
}

/**
 * Normaliza un valor numérico, devolviendo un fallback cuando no es válido.
 * @param {unknown} value Valor a normalizar.
 * @param {number} [fallback=0] Valor por defecto si no es numérico.
 * @returns {number}
 */
function normalizeQty(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Carga el carrito desde storage.
 * @param {Storage} [storage] Storage opcional para pruebas.
 * @returns {Array<{name: string, qty: number}>} Carrito cargado o vacío si no hay datos válidos.
 */
function loadCart(storage) {
  const store = safeStorage(storage);
  if (!store) return [];
  try {
    const saved = store.getItem(CART_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return normalizeCart(parsed);
  } catch (err) {
    console.warn('No se pudo leer el carrito guardado', err);
    return [];
  }
}

/**
 * Persiste el carrito en storage, ignorando fallos de escritura.
 * @param {Array<{name: string, qty: number}>} cart Carrito a guardar.
 * @param {Storage} [storage] Storage opcional para pruebas.
 * @returns {void}
 */
function persistCart(cart, storage) {
  const store = safeStorage(storage);
  if (!store) return;
  try {
    store.setItem(CART_KEY, JSON.stringify(cart));
  } catch (err) {
    console.warn('No se pudo guardar el carrito', err);
  }
}

/**
 * Calcula la cantidad total de ítems en el carrito.
 * @param {Array<{name: string, qty: number}>} [cart=[]] Carrito a evaluar.
 * @returns {number} Total de unidades.
 */
function getCartTotal(cart = []) {
  const normalized = normalizeCart(cart);
  return normalized.reduce((sum, item) => sum + (item.qty || 0), 0);
}

/**
 * Indica si el carrito contiene al menos un producto de preventa.
 * @param {Array<{name: string, qty: number}>} [cart=[]] Carrito a evaluar.
 * @returns {boolean} `true` cuando hay preventa.
 */
function hasPreorderItems(cart = []) {
  return normalizeCart(cart).some((item) => PREORDER_ITEMS.has(item.name));
}

/**
 * Construye el mensaje de WhatsApp a partir del carrito.
 * @param {Array<{name: string, qty: number}>} [cart=[]] Carrito actual.
 * @param {string} [note=PREORDER_NOTE] Nota adicional para preventa.
 * @returns {string} Mensaje listo para ser codificado.
 */
function buildWhatsappMessage(cart = [], note = PREORDER_NOTE) {
  const baseMessage = 'Hola, quiero pedir roles de canela.';
  const normalized = normalizeCart(cart);
  if (!normalized.length) return baseMessage;

  let detail =
    'Hola, quiero pedir:\n' + normalized.map((item) => `- ${item.name} x${item.qty}`).join('\n');
  if (hasPreorderItems(normalized)) {
    detail += `\n\n${note}`;
  }

  return detail;
}

/**
 * Arma la URL de WhatsApp con el mensaje precargado.
 * @param {Array<{name: string, qty: number}>} [cart=[]] Carrito actual.
 * @param {string} [phone=WHATSAPP_PHONE] Número de destino.
 * @param {string} [note=PREORDER_NOTE] Nota de preventa.
 * @returns {string} URL lista para abrir en el navegador.
 */
function buildWhatsappUrl(cart = [], phone = WHATSAPP_PHONE, note = PREORDER_NOTE) {
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
    buildWhatsappMessage(cart, note)
  )}`;
}

/**
 * Agrega un ítem al carrito, incrementando su cantidad si ya existe.
 * @param {Array<{name: string, qty: number}>} [cart=[]] Carrito base (no mutado).
 * @param {string} name Nombre del producto a añadir.
 * @returns {Array<{name: string, qty: number}>} Nuevo carrito con el ítem agregado.
 */
function addItemToCart(cart, name) {
  const baseCart = normalizeCart(cart);
  if (!name) return baseCart;
  const next = baseCart.map((item) => ({ ...item }));
  const existing = next.find((item) => item.name === name);
  if (existing) {
    existing.qty = normalizeQty(existing.qty, 0) + 1;
    return next;
  }
  return [...next, { name, qty: 1 }];
}

/**
 * Actualiza la cantidad de un ítem; elimina el ítem si llega a 0 o menos.
 * @param {Array<{name: string, qty: number}>} [cart=[]] Carrito base (no mutado).
 * @param {string} name Nombre del producto a modificar.
 * @param {number} delta Diferencia a aplicar (positiva o negativa).
 * @returns {Array<{name: string, qty: number}>} Carrito resultante.
 */
function updateItemQuantity(cart, name, delta) {
  const baseCart = normalizeCart(cart);
  const next = baseCart.map((item) => ({ ...item }));
  const index = next.findIndex((item) => item.name === name);
  if (index === -1) return next;

  const safeDelta = normalizeQty(delta, 0);
  const currentQty = normalizeQty(next[index].qty, 0);
  next[index].qty = currentQty + safeDelta;
  if (next[index].qty <= 0) {
    next.splice(index, 1);
  }
  return next;
}

const CartUtils = {
  CART_KEY,
  WHATSAPP_PHONE,
  PREORDER_ITEMS,
  PREORDER_NOTE,
  loadCart,
  persistCart,
  getCartTotal,
  hasPreorderItems,
  buildWhatsappMessage,
  buildWhatsappUrl,
  addItemToCart,
  updateItemQuantity,
};

globalThis.CartUtils = CartUtils;

/* istanbul ignore next */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartUtils;
}
