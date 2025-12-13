const {
  CART_KEY,
  PREORDER_NOTE,
  addItemToCart,
  buildWhatsappMessage,
  buildWhatsappUrl,
  getCartTotal,
  hasPreorderItems,
  loadCart,
  persistCart,
  updateItemQuantity,
} = require('../cart-utils');

describe('cart-utils', () => {
  /** Garantiza que `localStorage` exista en el entorno de pruebas. */
  test('loadCart returns parsed items and persistCart stores them', () => {
    const storage = {
      getItem: jest.fn(() => JSON.stringify([{ name: 'Test', qty: 2 }])),
      setItem: jest.fn(),
    };

    const cart = loadCart(storage);
    expect(cart).toEqual([{ name: 'Test', qty: 2 }]);

    persistCart(cart, storage);
    expect(storage.setItem).toHaveBeenCalledWith(CART_KEY, JSON.stringify(cart));
  });

  test('loadCart handles empty, invalid and non-array values', () => {
    const storage = {
      getItem: jest.fn(),
    };

    storage.getItem.mockReturnValueOnce(null);
    expect(loadCart(storage)).toEqual([]);

    storage.getItem.mockReturnValueOnce('not-json');
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadCart(storage)).toEqual([]);
    console.warn.mockRestore();

    storage.getItem.mockReturnValueOnce(JSON.stringify({ bad: 'shape' }));
    expect(loadCart(storage)).toEqual([]);
  });

  test('loadCart usa localStorage cuando está disponible', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    expect(loadCart()).toEqual([]);
    getItemSpy.mockRestore();
  });

  test('loadCart returns [] cuando no hay storage disponible', () => {
    const originalLocalStorage = globalThis.localStorage;
    delete global.localStorage;

    expect(loadCart()).toEqual([]);

    globalThis.localStorage = originalLocalStorage;
  });

  test('persistCart is resilient when storage missing or throws', () => {
    expect(() => persistCart([{ name: 'A', qty: 1 }])).not.toThrow();

    const originalLocalStorage = globalThis.localStorage;
    delete global.localStorage;
    expect(() => persistCart([{ name: 'A', qty: 1 }])).not.toThrow();
    globalThis.localStorage = originalLocalStorage;

    const storage = {
      setItem: jest.fn(() => {
        throw new Error('fail');
      }),
    };
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => persistCart([{ name: 'A', qty: 1 }], storage)).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
    console.warn.mockRestore();
  });

  test('addItemToCart and updateItemQuantity adjust quantities correctly', () => {
    expect(addItemToCart([{ name: 'Rol', qty: 1 }], '')).toEqual([{ name: 'Rol', qty: 1 }]);

    const initial = [{ name: 'Rol', qty: 1 }];
    const withNew = addItemToCart(initial, 'Nuevo');
    expect(withNew).toContainEqual({ name: 'Nuevo', qty: 1 });

    const incremented = addItemToCart(withNew, 'Rol');
    expect(incremented.find((item) => item.name === 'Rol')?.qty).toBe(2);

    const decreased = updateItemQuantity(incremented, 'Rol', -2);
    expect(decreased.find((item) => item.name === 'Rol')).toBeUndefined();

    const untouched = updateItemQuantity(incremented, 'Inexistente', 1);
    expect(untouched).toEqual(incremented);
  });

  test('updateItemQuantity increases qty without removal when delta is positive', () => {
    const cart = [{ name: 'Rol', qty: 1 }];
    const updated = updateItemQuantity(cart, 'Rol', 1);
    expect(updated.find((item) => item.name === 'Rol')?.qty).toBe(2);
  });

  test('getCartTotal sums quantities', () => {
    const total = getCartTotal([
      { name: 'A', qty: 1 },
      { name: 'B', qty: 3 },
    ]);
    expect(total).toBe(4);
  });

  test('hasPreorderItems detects preorder products', () => {
    const cart = [{ name: 'Frutilla (Rosca Roll 12 porciones)', qty: 1 }];
    expect(hasPreorderItems(cart)).toBe(true);
  });

  test('buildWhatsappMessage and URL include preorder note when needed', () => {
    const cart = [{ name: 'Frutilla (Rosca Roll 12 porciones)', qty: 1 }];
    const message = buildWhatsappMessage(cart);
    expect(message).toContain(PREORDER_NOTE);

    const url = buildWhatsappUrl(cart);
    expect(url).toContain(encodeURIComponent(PREORDER_NOTE));
  });

  test('buildWhatsappMessage returns base message when cart is empty', () => {
    const message = buildWhatsappMessage([]);
    expect(message).toBe('Hola, quiero pedir roles de canela.');
  });

  test('buildWhatsappMessage omits preorder note when cart has no preorder items', () => {
    const message = buildWhatsappMessage([{ name: 'Rol tradicional', qty: 2 }]);
    expect(message).not.toContain(PREORDER_NOTE);
  });

  test('funciones usan valores por defecto cuando no se proveen argumentos', () => {
    expect(getCartTotal()).toBe(0);
    expect(hasPreorderItems()).toBe(false);

    const defaultMessage = buildWhatsappMessage();
    expect(defaultMessage).toBe('Hola, quiero pedir roles de canela.');

    const defaultUrl = buildWhatsappUrl();
    expect(defaultUrl).toContain('https://api.whatsapp.com/send');

    expect(addItemToCart(undefined, 'Item')).toEqual([{ name: 'Item', qty: 1 }]);
    expect(updateItemQuantity(undefined, 'Item', 1)).toEqual([]);
  });
});
