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
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.classList.remove('active'); // Close mobile menu on click

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });

    // Carrito en memoria
    const CART_KEY = 'hecho_capriccio_cart';
    const WHATSAPP_PHONE = '50257199544';
    let cart = loadCart();

    const cartFloating = document.querySelector('.cart-floating');
    const cartToggle = document.querySelector('.cart-toggle');
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.querySelector('.cart-items');
    const cartEmpty = document.querySelector('.cart-empty');
    const cartClearBtn = document.querySelector('.cart-clear');
    const cartWhatsappBtn = document.querySelector('.cart-whatsapp');
    const whatsappLinks = document.querySelectorAll('.whatsapp-link');

    function loadCart() {
        try {
            const saved = localStorage.getItem(CART_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('No se pudo leer el carrito guardado', e);
            return [];
        }
    }

    function persistCart() {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function getCartTotal() {
        return cart.reduce((sum, item) => sum + item.qty, 0);
    }

    function buildWhatsappUrl() {
        const baseMessage = 'Hola, quiero pedir roles de canela.';
        const detail = cart.length
            ? 'Hola, quiero pedir:\n' + cart.map(item => `- ${item.name} x${item.qty}`).join('\n')
            : baseMessage;

        return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(detail)}`;
    }

    function updateWhatsappLinks() {
        const url = buildWhatsappUrl();
        whatsappLinks.forEach(link => {
            link.setAttribute('href', url);
        });
    }

    function renderCart() {
        const total = getCartTotal();
        cartCount.textContent = total;
        cartItems.innerHTML = '';

        if (cartFloating) {
            if (total > 0) {
                cartFloating.classList.add('visible');
            } else {
                cartFloating.classList.remove('visible', 'open');
            }
        }

        if (!total) {
            cartEmpty.style.display = 'block';
            cartWhatsappBtn.disabled = true;
            cartClearBtn.disabled = true;
        } else {
            cartEmpty.style.display = 'none';
            cartWhatsappBtn.disabled = false;
            cartClearBtn.disabled = false;

            cart.forEach(item => {
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

    function addToCart(name) {
        const existing = cart.find(item => item.name === name);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ name, qty: 1 });
        }
        persistCart();
        renderCart();
    }

    function updateQty(name, delta) {
        const index = cart.findIndex(item => item.name === name);
        if (index === -1) return;

        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        persistCart();
        renderCart();
    }

    function clearCart() {
        cart = [];
        persistCart();
        renderCart();
    }

    // Bind product buttons
    document.querySelectorAll('.product-card').forEach(card => {
        const name = card.querySelector('h3')?.textContent?.trim();
        const btn = card.querySelector('.btn-icon');
        if (name && btn) {
            btn.addEventListener('click', () => {
                addToCart(name);
                if (cartFloating) {
                    cartFloating.classList.add('open');
                }
            });
        }
    });

    if (cartToggle && cartFloating) {
        cartToggle.addEventListener('click', () => {
            cartFloating.classList.toggle('open');
        });
    }

    if (cartClearBtn) {
        cartClearBtn.addEventListener('click', clearCart);
    }

    if (cartWhatsappBtn) {
        cartWhatsappBtn.addEventListener('click', () => {
            const url = buildWhatsappUrl();
            window.open(url, '_blank');
        });
    }

    renderCart();
});
