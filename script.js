(() => {
  const sentryDsn = document.querySelector('meta[name="sentry-dsn"]')?.content?.trim();
  const sentryRelease = document.querySelector('meta[name="sentry-release"]')?.content?.trim();
  if (sentryDsn && globalThis.Sentry) {
    globalThis.Sentry.init({
      dsn: sentryDsn,
      release: sentryRelease || undefined,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1,
      integrations: [
        globalThis.Sentry.browserTracingIntegration(),
        globalThis.Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
      ],
    });
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Smooth Scroll for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      navLinks.classList.remove('active'); // Close mobile menu on click

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + globalThis.pageYOffset - headerOffset;

        globalThis.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    });
  });

  // Intersection Observer for Animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in-up').forEach((el) => {
    observer.observe(el);
  });

  // Carrito en memoria
  const CartUtils = globalThis.CartUtils;
  if (!CartUtils) {
    console.error('Cart utilities no disponibles');
    return;
  }

  const {
    loadCart,
    persistCart,
    getCartTotal,
    buildWhatsappUrl,
    addItemToCart,
    updateItemQuantity,
  } = CartUtils;
  let cart = loadCart();

  const cartFloating = document.querySelector('.cart-floating');
  const cartToggle = document.querySelector('.cart-toggle');
  const cartCount = document.querySelector('.cart-count');
  const cartItems = document.querySelector('.cart-items');
  const cartEmpty = document.querySelector('.cart-empty');
  const cartClearBtn = document.querySelector('.cart-clear');
  const cartWhatsappBtn = document.querySelector('.cart-whatsapp');
  const whatsappLinks = document.querySelectorAll('.whatsapp-link');

  /**
   * Actualiza todos los enlaces de WhatsApp con el estado actual del carrito.
   * Construye la URL cada vez para reflejar cantidades y preventas.
   */
  function updateWhatsappLinks() {
    const url = buildWhatsappUrl(cart);
    whatsappLinks.forEach((link) => {
      link.setAttribute('href', url);
    });
  }

  /**
   * Dibuja el carrito flotante y los contadores del DOM según el estado en memoria.
   * Muestra u oculta secciones y botones, y actualiza los enlaces de WhatsApp.
   */
  function renderCart() {
    const total = getCartTotal(cart);
    cartCount.textContent = total;
    cartItems.innerHTML = '';

    if (cartFloating) {
      if (total > 0) {
        cartFloating.classList.add('visible');
      } else {
        cartFloating.classList.remove('visible', 'open');
      }
    }

    if (total === 0) {
      cartEmpty.style.display = 'block';
      cartWhatsappBtn.disabled = true;
      cartClearBtn.disabled = true;
    } else {
      cartEmpty.style.display = 'none';
      cartWhatsappBtn.disabled = false;
      cartClearBtn.disabled = false;

      cart.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'cart-item';

        const title = document.createElement('h4');
        title.textContent = item.name;

        const controls = document.createElement('div');
        controls.className = 'cart-qty';

        const minus = document.createElement('button');
        minus.type = 'button';
        minus.textContent = '-';
        minus.addEventListener('click', () => updateQty(item.name, -1));

        const qty = document.createElement('span');
        qty.textContent = `x${item.qty}`;

        const plus = document.createElement('button');
        plus.type = 'button';
        plus.textContent = '+';
        plus.addEventListener('click', () => updateQty(item.name, 1));

        controls.append(minus, qty, plus);
        li.append(title, controls);
        cartItems.appendChild(li);
      });
    }

    updateWhatsappLinks();
  }

  /**
   * Agrega un producto al carrito, persiste el cambio y vuelve a renderizar.
   * @param {string} name Nombre del producto a agregar.
   */
  function addToCart(name) {
    cart = addItemToCart(cart, name);
    persistCart(cart);
    renderCart();
  }

  /**
   * Ajusta la cantidad de un producto y actualiza la UI.
   * @param {string} name Nombre del producto.
   * @param {number} delta Cantidad a sumar o restar.
   */
  function updateQty(name, delta) {
    cart = updateItemQuantity(cart, name, delta);
    persistCart(cart);
    renderCart();
  }

  /**
   * Limpia el carrito y sincroniza el estado con el DOM.
   */
  function clearCartHandler() {
    cart = [];
    persistCart(cart);
    renderCart();
  }

  // Bind product buttons
  document.querySelectorAll('.product-card').forEach((card) => {
    const name = card.querySelector('h3')?.textContent?.trim();
    const btn = card.querySelector('.btn-icon');
    if (name && btn) {
      btn.setAttribute('aria-label', `Agregar ${name} al carrito`);
      btn.addEventListener('click', () => {
        addToCart(name);
        if (cartFloating) {
          cartFloating.classList.add('open');
          cartToggle?.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  if (cartToggle && cartFloating) {
    cartToggle.setAttribute('aria-expanded', 'false');
    cartToggle.addEventListener('click', () => {
      const isOpen = cartFloating.classList.toggle('open');
      cartToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  if (cartClearBtn) {
    cartClearBtn.addEventListener('click', clearCartHandler);
  }

  if (cartWhatsappBtn) {
    cartWhatsappBtn.addEventListener('click', () => {
      const url = buildWhatsappUrl(cart);
      window.open(url, '_blank');
    });
  }

  // Año dinámico en el footer
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  renderCart();
});
