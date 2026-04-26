const {
  CART_KEY,
  addItemToCart,
  buildWhatsappMessage,
  buildWhatsappUrl,
  getCartTotal,
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

  test('loadCart normaliza y filtra datos corruptos', () => {
    const storage = {
      getItem: jest.fn(() =>
        JSON.stringify([
          null,
          'texto',
          { name: '', qty: 2 },
          { name: 'Bueno', qty: '3' },
          { name: 'Negativo', qty: -2 },
          { name: 'NoNumero', qty: 'abc' },
        ])
      ),
    };

    expect(loadCart(storage)).toEqual([{ name: 'Bueno', qty: 3 }]);
  });

  test('loadCart usa localStorage cuando está disponible', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    expect(loadCart()).toEqual([]);
    getItemSpy.mockRestore();
  });

  test('loadCart returns [] cuando no hay storage disponible', () => {
    const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });

    expect(loadCart()).toEqual([]);

    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    } else {
      delete globalThis.localStorage;
    }
  });

  test('persistCart is resilient when storage missing or throws', () => {
    expect(() => persistCart([{ name: 'A', qty: 1 }])).not.toThrow();

    const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
    expect(() => persistCart([{ name: 'A', qty: 1 }])).not.toThrow();
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    } else {
      delete globalThis.localStorage;
    }

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

  test('addItemToCart y updateItemQuantity toleran cantidades no numéricas', () => {
    const initial = [{ name: 'Rol', qty: 'foo' }];
    const added = addItemToCart(initial, 'Rol');
    expect(added.find((item) => item.name === 'Rol')?.qty).toBe(1);

    const updated = updateItemQuantity([{ name: 'Rol', qty: 2 }], 'Rol', 'no-num');
    expect(updated.find((item) => item.name === 'Rol')?.qty).toBe(2);
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

  test('buildWhatsappMessage returns base message when cart is empty', () => {
    const message = buildWhatsappMessage([]);
    expect(message).toBe('Hola, quiero pedir roles de canela.');
  });

  test('buildWhatsappMessage lists current cart items without preorder note', () => {
    const message = buildWhatsappMessage([{ name: 'KitKat', qty: 2 }]);
    expect(message).toBe('Hola, quiero pedir:\n- KitKat x2');
  });

  test('funciones usan valores por defecto cuando no se proveen argumentos', () => {
    expect(getCartTotal()).toBe(0);

    const defaultMessage = buildWhatsappMessage();
    expect(defaultMessage).toBe('Hola, quiero pedir roles de canela.');

    const defaultUrl = buildWhatsappUrl();
    expect(defaultUrl).toContain('https://api.whatsapp.com/send');

    expect(addItemToCart(undefined, 'Item')).toEqual([{ name: 'Item', qty: 1 }]);
    expect(updateItemQuantity(undefined, 'Item', 1)).toEqual([]);
  });
});
