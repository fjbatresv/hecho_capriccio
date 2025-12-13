/**
 * Tests para la lógica de UI en script.js utilizando jsdom.
 */

const buildCartUtilsStub = () => {
  return {
    loadCart: jest.fn(() => []),
    persistCart: jest.fn(),
    getCartTotal: jest.fn((cart = []) => cart.reduce((sum, item) => sum + item.qty, 0)),
    buildWhatsappUrl: jest.fn((cart = []) => `https://example.test/cart-${cart.length}`),
    addItemToCart: jest.fn((cart = [], name) => {
      if (!name) return cart;
      const existing = cart.find((item) => item.name === name);
      if (existing) {
        return cart.map((item) =>
          item.name === name ? { ...item, qty: item.qty + 1 } : { ...item }
        );
      }
      return [...cart.map((item) => ({ ...item })), { name, qty: 1 }];
    }),
    updateItemQuantity: jest.fn((cart = [], name, delta) => {
      const next = cart.map((item) => ({ ...item }));
      const index = next.findIndex((item) => item.name === name);
      if (index === -1) return next;
      next[index].qty += delta;
      if (next[index].qty <= 0) {
        next.splice(index, 1);
      }
      return next;
    }),
  };
};

const mountDom = () => {
  document.body.innerHTML = `
    <button class="mobile-menu-btn"></button>
    <ul class="nav-links">
      <li><a href="#home">Home</a></li>
    </ul>
    <section id="home"></section>
    <div class="fade-in-up" data-testid="animated"></div>
    <div class="cart-floating">
      <button class="cart-toggle"></button>
    </div>
    <span class="cart-count"></span>
    <ul class="cart-items"></ul>
    <div class="cart-empty"></div>
    <button class="cart-clear"></button>
    <button class="cart-whatsapp"></button>
    <a class="whatsapp-link"></a>
    <span id="current-year"></span>
    <div class="product-card">
      <h3>Rol Test</h3>
      <button class="btn-icon"></button>
    </div>
  `;
};

describe('script.js UI behavior', () => {
  let intersectionSpy;

  beforeEach(() => {
    mountDom();

    const observerMock = class {
      constructor(cb) {
        this.cb = cb;
      }
      observe(target) {
        this.cb([{ isIntersecting: true, target }]);
      }
      unobserve() {}
    };
    globalThis.IntersectionObserver = observerMock;
    intersectionSpy = jest.spyOn(observerMock.prototype, 'observe');

    globalThis.pageYOffset = 0;
    globalThis.scrollTo = jest.fn();
    globalThis.open = jest.fn();
    globalThis.CartUtils = buildCartUtilsStub();
    delete globalThis.Sentry;
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
    delete globalThis.CartUtils;
    delete globalThis.IntersectionObserver;
  });

  const loadScript = () => {
    jest.isolateModules(() => {
      require('../script');
    });
    document.dispatchEvent(new Event('DOMContentLoaded'));
  };

  test('abre/cierra menú móvil', () => {
    loadScript();
    const navLinks = document.querySelector('.nav-links');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    expect(navLinks.classList.contains('active')).toBe(false);
    mobileBtn.click();
    expect(navLinks.classList.contains('active')).toBe(true);
    mobileBtn.click();
    expect(navLinks.classList.contains('active')).toBe(false);
  });

  test('agrega producto al carrito y actualiza enlaces de WhatsApp', () => {
    loadScript();
    const cartUtils = globalThis.CartUtils;
    const addBtn = document.querySelector('.product-card .btn-icon');
    addBtn.click();

    expect(cartUtils.addItemToCart).toHaveBeenCalledWith([], 'Rol Test');
    expect(document.querySelector('.cart-count').textContent).toBe('1');
    expect(document.querySelector('.cart-floating').classList.contains('visible')).toBe(true);
    expect(document.querySelector('.cart-floating').classList.contains('open')).toBe(true);
    expect(document.querySelector('.whatsapp-link').getAttribute('href')).toBe(
      'https://example.test/cart-1'
    );
  });

  test('actualiza cantidades con controles de carrito', () => {
    loadScript();
    const addBtn = document.querySelector('.product-card .btn-icon');
    addBtn.click(); // qty 1

    const qtyControls = document.querySelectorAll('.cart-qty button');
    const minus = qtyControls[0];
    const plus = qtyControls[1];

    plus.click(); // qty 2
    expect(document.querySelector('.cart-count').textContent).toBe('2');

    minus.click(); // qty 1
    minus.click(); // qty 0 -> remove
    expect(document.querySelector('.cart-count').textContent).toBe('0');
  });

  test('hace scroll suave al pulsar un ancla', () => {
    loadScript();
    const anchor = document.querySelector('.nav-links a');
    anchor.click();
    expect(globalThis.scrollTo).toHaveBeenCalled();
  });

  test('inicializa Sentry cuando hay DSN y release', () => {
    const metaDsn = document.createElement('meta');
    metaDsn.setAttribute('name', 'sentry-dsn');
    metaDsn.setAttribute('content', 'https://dsn.example');
    const metaRelease = document.createElement('meta');
    metaRelease.setAttribute('name', 'sentry-release');
    metaRelease.setAttribute('content', '1.0.0');
    document.head.append(metaDsn, metaRelease);

    const initMock = jest.fn();
    const tracingMock = jest.fn();
    const replayMock = jest.fn();
    globalThis.Sentry = {
      init: initMock,
      browserTracingIntegration: tracingMock,
      replayIntegration: replayMock,
    };

    loadScript();

    expect(initMock).toHaveBeenCalled();
    metaDsn.remove();
    metaRelease.remove();
  });

  test('toggle de carrito, limpiar carrito y abrir WhatsApp', () => {
    loadScript();
    const addBtn = document.querySelector('.product-card .btn-icon');
    addBtn.click();

    const toggle = document.querySelector('.cart-toggle');
    toggle.click();
    toggle.click();

    const cartWhatsappBtn = document.querySelector('.cart-whatsapp');
    cartWhatsappBtn.click();
    expect(globalThis.open).toHaveBeenCalledWith('https://example.test/cart-1', '_blank');

    const clearBtn = document.querySelector('.cart-clear');
    clearBtn.click();
    expect(document.querySelector('.cart-count').textContent).toBe('0');
    expect(document.querySelector('.cart-floating').classList.contains('visible')).toBe(false);
    expect(document.getElementById('current-year').textContent).toBe(
      new Date().getFullYear().toString()
    );
  });

  test('IntersectionObserver marca elementos visibles', () => {
    loadScript();
    expect(intersectionSpy).toHaveBeenCalled();
    expect(document.querySelector('[data-testid="animated"]').classList.contains('visible')).toBe(
      true
    );
  });
});
