// ProductModule.js
class Product {
    constructor(id, name, description, price, images, category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.images = Array.isArray(images) ? images : [images];
        this.category = category;
    }

    get mainImage() {
        return this.images[0];
    }

    formattedPrice() {
        return `S/ ${this.price.toFixed(2)}`;
    }

    // Método para simplificar el objeto al guardar en localStorage
    toSimpleObject() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            price: this.price,
            image: this.mainImage, // Solo guardamos la imagen principal
            category: this.category
        };
    }
}

class ShoppingCart {
    constructor(productCatalog) {
        this.items = [];
        this.productCatalog = productCatalog; // Catálogo completo de productos
        this.loadCart();
    }

    addItem(productId, quantity = 1) {
        const product = this.productCatalog.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                productId: product.id,
                quantity: quantity
            });
        }
        
        this.updateCart();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.updateCart();
    }

    updateQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.productId === productId);
        
        if (item) {
            if (newQuantity > 0) {
                item.quantity = newQuantity;
            } else {
                this.removeItem(productId);
            }
        }
        
        this.updateCart();
    }

    calculateTotal() {
        return this.items.reduce((total, item) => {
            const product = this.productCatalog.find(p => p.id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    }

    clearCart() {
        this.items = [];
        this.updateCart();
    }

    getCartItems() {
        return this.items.map(item => {
            const product = this.productCatalog.find(p => p.id === item.productId);
            return product ? {
                product: product.toSimpleObject(),
                quantity: item.quantity
            } : null;
        }).filter(item => item !== null);
    }

    updateCart() {
        this.saveCart();
        this.updateCartUI();
    }

    saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
    }

    loadCart() {
        const savedCart = localStorage.getItem('shoppingCart');
        this.items = savedCart ? JSON.parse(savedCart) : [];
    }

    updateCartUI() {
        const cartCount = document.getElementById('cartCount');
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartCount) {
            cartCount.textContent = this.items.reduce((count, item) => count + item.quantity, 0);
        }
        
        if (cartItemsContainer) {
            const cartItems = this.getCartItems();
            cartItemsContainer.innerHTML = cartItems.length === 0 
                ? '<p>Tu carrito está vacío</p>'
                : cartItems.map(item => `
                    <div class="cart-item">
                        <img src="${item.product.image}" alt="${item.product.name}">
                        <div class="cart-item-info">
                            <div class="cart-item-title">${item.product.name}</div>
                            <div class="cart-item-price">S/ ${(item.product.price * item.quantity).toFixed(2)}</div>
                        </div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn minus" data-id="${item.product.id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn plus" data-id="${item.product.id}">+</button>
                        </div>
                        <span class="remove-item" data-id="${item.product.id}">🗑️</span>
                    </div>
                `).join('');
        }
        
        if (cartTotal) {
            cartTotal.textContent = `S/ ${this.calculateTotal().toFixed(2)}`;
        }
        
        this.setupCartItemEvents();
    }

    setupCartItemEvents() {
        document.querySelectorAll('.minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateQuantity(parseInt(e.target.dataset.id), 
                this.items.find(item => item.productId === parseInt(e.target.dataset.id)).quantity - 1);
            });
        });

        document.querySelectorAll('.plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateQuantity(parseInt(e.target.dataset.id), 
                this.items.find(item => item.productId === parseInt(e.target.dataset.id)).quantity + 1);
            });
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeItem(parseInt(e.target.dataset.id));
            });
        });
    }
}

class ProductRenderer {
    constructor(products, cart) {
        this.products = products;
        this.cart = cart;
        this.setupEventListeners();
    }

    renderProductsByCategory(category, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Limpiar solo productos, no todo el contenedor
        const existingProducts = container.querySelectorAll('.product-item, .item, .promociones-card');
        existingProducts.forEach(el => el.remove());

        this.products
            .filter(product => product.category === category)
            .forEach(product => {
                const productElement = document.createElement('div');
                productElement.className = this.getProductClass(category);
                productElement.innerHTML = this.getProductHTML(product, category);
                container.appendChild(productElement);
            });

        this.setupAddToCartEvents();
    }

    getProductClass(category) {
        return {
            'menu': 'item',
            'promociones': 'promociones-card',
            'destacados': 'product-card'
        }[category] || 'product-item';
    }

    getProductHTML(product, category) {
        const imagesHTML = category === 'destacados' && product.images.length > 1
            ? `<div class="product-images">${
                product.images.map((img, i) => 
                    `<img src="${img}" alt="${product.name} ${i+1}" 
                      onerror="this.onerror=null;this.src='imagenes/placeholder.jpg'">`
                ).join('')
              }</div>`
            : `<img src="${product.mainImage}" alt="${product.name}" 
                onerror="this.onerror=null;this.src='imagenes/placeholder.jpg'">`;

        return `
            ${imagesHTML}
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <span class="price">${product.formattedPrice()}</span>
            <button class="add-to-cart" data-id="${product.id}">Añadir al Carrito</button>
        `;
    }

    setupAddToCartEvents() {
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id);
                this.cart.addItem(productId);
                this.showNotification(`${e.target.closest('.item, .product-card, .promociones-card').querySelector('h3').textContent} añadido al carrito`);
            });
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        // Eventos del carrito
        document.getElementById('cartIcon')?.addEventListener('click', () => {
            document.getElementById('cartModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.cart.updateCartUI();
        });

        document.getElementById('closeModal')?.addEventListener('click', () => {
            document.getElementById('cartModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        document.getElementById('cartModal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('cartModal')) {
                document.getElementById('cartModal').style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            if (this.cart.items.length > 0) {
                alert(`Compra realizada por S/ ${this.cart.calculateTotal().toFixed(2)}. ¡Gracias!`);
                this.cart.clearCart();
                document.getElementById('cartModal').style.display = 'none';
                document.body.style.overflow = 'auto';
            } else {
                alert('Tu carrito está vacío');
            }
        });

        // Evento del formulario
        document.getElementById('contactForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            if (name && email && message) {
                alert(`Gracias ${name}, nos pondremos en contacto pronto.`);
                e.target.reset();
            } else {
                alert('Por favor completa todos los campos.');
            }
        });
    }
}

// Uso del módulo
document.addEventListener('DOMContentLoaded', () => {
    const products = [
        // Productos del menú principal
        new Product(1, 'Pastel de Chocolate', 'Relleno de mousse y cobertura de ganache', 35.00, 'imagenes/tortaChocolate.jpg', 'menu'),
        new Product(2, 'Cheesecake de Fresa', 'Base de galleta y fresas frescas', 40.00, 'imagenes/Cheesecake de Fresa.webp', 'menu'),
        new Product(3, 'Tarta de Limón', 'Con merengue flameado', 30.00, 'imagenes/Tarta de Limón.jpg', 'menu'),
        
        // Promociones
        new Product(4, 'Pastel de Chocolate (Promo)', 'Delicioso pastel de chocolate con relleno de crema y cubierta de ganache', 350.00, 'imagenes/pastel de chocolate.avif', 'promociones'),
        new Product(5, 'Cupcakes Variados', 'Paquete de 6 cupcakes con diferentes sabores y decoraciones', 180.00, 'imagenes/cupcakesVariados.avif', 'promociones'),
        new Product(6, 'Galletas Decoradas', 'Docena de galletas con diseños personalizados y diferentes sabores', 220.00, 'imagenes/galletasDecoradas.jpg', 'promociones'),
        
        // Productos destacados (con múltiples imágenes)
        new Product(7, 'Pastel de Cumpleaños', 'Decoración personalizada y sabores a elección', 120.00, ['imagenes/tor1.jpg', 'imagenes/tor2.jpg', 'imagenes/tor3.webp'], 'destacados'),
        new Product(8, 'Mini Cupcakes', 'Ideales para eventos y reuniones', 80.00, ['imagenes/cuk1.jpg', 'imagenes/cuk2.jpg', 'imagenes/cuk3.jpg'], 'destacados'),
        new Product(9, 'Brownies', 'Clásicos y con nueces', 45.00, ['imagenes/brow1.jpg', 'imagenes/brow2.jpg', 'imagenes/brow3.jpg'], 'destacados'),
        new Product(12, 'Macarons', 'Paquete de 12 macarons de diferentes sabores', 65.00, ['imagenes/macarons.jpg', 'imagenes/macarons1.jpg', 'imagenes/macarons2.jpg'], 'destacados'),
        new Product(14, 'Profiteroles', 'Pequeños bollos de crema pastelera con chocolate', 50.00, ['imagenes/profiteroles.jpg', 'imagenes/profiteroles1.jpg', 'imagenes/profiteroles2.jpg'], 'destacados')
    ];

    const cart = new ShoppingCart(products);
    const productRenderer = new ProductRenderer(products, cart);

    // Renderizar todas las categorías
    productRenderer.renderProductsByCategory('menu', 'menuItems');
    productRenderer.renderProductsByCategory('promociones', 'promocionesGrid');
    productRenderer.renderProductsByCategory('destacados', 'productoLista');

    // Actualizar el carrito al inicio
    cart.updateCartUI();
});