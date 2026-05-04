 const WHATSAPP_NUMBER = "9182112120";

// =========================================
// FIREBASE INITIALIZATION
// =========================================
const firebaseConfig = {
  apiKey: "AIzaSyBPx-vq-U49-eVShAmqtl76gZxkNrzab5c",
  authDomain: "studio-8663990014-66c3b.firebaseapp.com",
  databaseURL: "https://studio-8663990014-66c3b-default-rtdb.firebaseio.com",
  projectId: "studio-8663990014-66c3b",
  storageBucket: "studio-8663990014-66c3b.firebasestorage.app",
  messagingSenderId: "1058628689901",
  appId: "1:1058628689901:web:232aba87b6c85d56ef91e4"
};

// Initialize Firebase App, Auth, and Firestore
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// =========================================
// DYNAMIC PRODUCT DATABASE
// =========================================
let products = []; // Starts empty! We will fill it from the database.

// Fetch products from Firestore
async function fetchProducts() {
    try {
        const snapshot = await db.collection('products').get();
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Only render if we are on the shop page
        if (document.body.id === 'page-shop') {
            renderProducts(products);
        }
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// =========================================
// CART LOGIC
// =========================================
let cart = JSON.parse(localStorage.getItem('ssk_cart')) || [];
function saveCart() { localStorage.setItem('ssk_cart', JSON.stringify(cart)); }

function renderProducts(productsToRender) {
  const grid = document.getElementById('product-grid');
  if (!grid) return; 

  grid.innerHTML = '';
  if (productsToRender.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 3rem;">No products available at the moment.</p>';
    return;
  }

  productsToRender.forEach(product => {
    const stockClass = product.inStock ? 'in-stock' : 'out-of-stock';
    const buttonText = product.inStock ? 'ADD TO CART' : 'OUT OF STOCK';
    const buttonState = product.inStock ? '' : 'disabled';
    const icon = product.inStock ? '<i class="ph-bold ph-shopping-cart-simple"></i>' : '';

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image-container" onclick="openQuickView('${product.id}')">
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
        <img src="${product.lifestyleImage}" alt="${product.name} preview" class="lifestyle-image" loading="lazy">
        <div class="quick-view-overlay"><i class="ph-bold ph-eye"></i> Quick View</div>
      </div>
      <div class="product-info">
        <span class="stock-badge ${stockClass}">${product.inStock ? 'Available' : 'Out of Stock'}</span>
        <h3>${product.name}</h3>
        <p class="size-category">${product.size} | ${product.category}</p>
        <p class="price">₹${product.price}</p>
        <button class="btn-add-cart" ${buttonState} onclick="addToCart('${product.id}')">${icon} ${buttonText}</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) existingItem.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  
  saveCart();
  updateCartUI();
  const sidebar = document.getElementById('cart-sidebar');
  if (sidebar && !sidebar.classList.contains('open')) toggleCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
}

function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if(!sidebar) return;
  sidebar.classList.toggle('open');
  if (sidebar.classList.contains('open')) {
    overlay.style.display = 'block';
    setTimeout(() => overlay.classList.add('show'), 10);
  } else {
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 300);
  }
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  const itemsContainer = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total-price');
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) badge.innerText = totalItems;
  
  if (!itemsContainer) return; 
  if (cart.length === 0) {
    itemsContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 2rem;">Your cart is empty.</p>';
    totalElement.innerText = '₹0';
    return;
  }
  
  let html = '';
  let totalPrice = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    totalPrice += itemTotal;
    html += `
      <div class="cart-item">
        <div class="cart-item-details">
          <p class="cart-item-title">${item.name}</p>
          <p class="cart-item-meta">Qty: ${item.quantity} x ₹${item.price}</p>
        </div>
        <div style="text-align: right;">
          <p class="cart-item-price">₹${itemTotal}</p>
          <span class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</span>
        </div>
      </div>`;
  });
  itemsContainer.innerHTML = html;
  totalElement.innerText = `₹${totalPrice}`;
}

// Check out and SAVE TO DATABASE
async function checkoutWhatsApp() {
  if (cart.length === 0) return alert("Please add items to your cart first.");
  
  let grandTotal = 0;
  let message = checkoutLanguage === 'te' 
    ? "Hello Sagar anna!\n\nSri Sai Krishna Graphics nunchi ee items order cheddam anukuntunnanu:\n\n"
    : "Hello Sagar!\n\nI would like to place an order from Sri Sai Krishna Graphics:\n\n";
  
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    grandTotal += itemTotal;
    message += `${index + 1}. *${item.name}*\n   - Qty: ${item.quantity}\n   - Subtotal: ₹${itemTotal}\n\n`;
  });
  
  message += checkoutLanguage === 'te' 
    ? `*Total Amount: ₹${grandTotal}*\n\nPhotos/logos details chat lo share chesthanu. Please confirm!`
    : `*Estimated Grand Total: ₹${grandTotal}*\n\nI will send over my photos/logos and discuss details on chat!`;

  // 1. Save the order to Firestore
  try {
      const orderData = {
          items: cart,
          totalAmount: grandTotal,
          status: 'Pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          customerEmail: auth.currentUser ? auth.currentUser.email : 'Guest'
      };
      
      await db.collection('orders').add(orderData);
      console.log("Order securely saved to database.");

      // 2. Clear the cart
      localStorage.removeItem('ssk_cart');
      cart = [];
      updateCartUI();

      // 3. Send the user to WhatsApp
      window.open(`https://wa.me/91${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
      toggleCart();

  } catch (error) {
      console.error("Database Error:", error);
      alert("There was an error saving your order. Please try again.");
  }
}

// =========================================
// QUICK VIEW MODAL
// =========================================
function openQuickView(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'qv-overlay';
    modal.onclick = function(e) { if(e.target === modal) closeQuickView(); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="qv-modal">
      <button class="qv-close" onclick="closeQuickView()"><i class="ph-bold ph-x"></i></button>
      <div class="qv-content">
        <div class="qv-image"><img src="${product.image}" alt="${product.name}"></div>
        <div class="qv-details">
          <span class="stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}">${product.inStock ? 'Available to Order' : 'Out of Stock'}</span>
          <h2>${product.name}</h2>
          <p class="qv-price">₹${product.price}</p>
          <p class="qv-desc">${product.description}</p>
          <ul class="qv-specs">
            <li><strong>Category:</strong> <span style="text-transform: capitalize;">${product.category}</span></li>
            <li><strong>Size:</strong> ${product.size}</li>
          </ul>
          <button class="btn-add-cart" style="margin-top:auto;" onclick="addToCart('${product.id}'); closeQuickView();" ${product.inStock ? '' : 'disabled'}>
            <i class="ph-bold ph-shopping-cart-simple"></i> ADD TO CART
          </button>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => modal.classList.add('show'), 10);
}

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) modal.classList.remove('show');
}

// =========================================
// SHOP FILTERS & UTILS
// =========================================
function handleSearch() { applyFilters(); }
function handleFilter() { applyFilters(); }
function applyFilters() {
  const searchTermInput = document.getElementById('searchInput');
  const categoryFilterSelect = document.getElementById('categoryFilter');
  if (!searchTermInput || !categoryFilterSelect) return;

  const searchTerm = searchTermInput.value.toLowerCase();
  const categoryTerm = categoryFilterSelect.value;
  const filtered = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) || product.size.toLowerCase().includes(searchTerm);
    const matchesCategory = categoryTerm === 'all' || product.category === categoryTerm;
    return matchesSearch && matchesCategory;
  });
  renderProducts(filtered);
}

function checkPincode() {
  const inputElement = document.getElementById('pincodeInput');
  const msgSpan = document.getElementById('pincodeMsg');
  if (!inputElement || !msgSpan) return;

  if (inputElement.value.length === 6 && !isNaN(inputElement.value)) {
    msgSpan.style.color = 'var(--stock-green)';
    msgSpan.innerHTML = '<i class="ph-fill ph-check-circle" style="margin-right: 4px;"></i> Delivery Available!';
  } else {
    msgSpan.style.color = 'var(--stock-red)';
    msgSpan.innerHTML = '<i class="ph-fill ph-warning-circle" style="margin-right: 4px;"></i> Invalid Pincode.';
  }
  setTimeout(() => { msgSpan.innerHTML = ''; }, 4000);
}

function toggleFAQ(button) {
  const item = button.parentElement;
  item.classList.toggle('active');
}

// =========================================
// APP SETTINGS LOGIC
// =========================================
let currentTheme = localStorage.getItem('ssk_theme') || 'dark';
let checkoutLanguage = localStorage.getItem('ssk_lang') || 'en';

function applySavedSettings() {
  setTheme(currentTheme);
  const langSelect = document.getElementById('lang-select');
  if(langSelect) langSelect.value = checkoutLanguage;
}

function toggleSettings() {
  const sidebar = document.getElementById('settings-sidebar');
  const overlay = document.getElementById('settings-overlay');
  sidebar.classList.toggle('open');
  if (sidebar.classList.contains('open')) {
    overlay.style.display = 'block';
    setTimeout(() => overlay.classList.add('show'), 10);
  } else {
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 300);
  }
}

function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('ssk_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  const btnLight = document.getElementById('btn-theme-light');
  const btnDark = document.getElementById('btn-theme-dark');
  if(btnLight && btnDark) {
    if(theme === 'light') { btnLight.classList.add('active'); btnDark.classList.remove('active'); } 
    else { btnDark.classList.add('active'); btnLight.classList.remove('active'); }
  }
}

function setLanguage(lang) {
  checkoutLanguage = lang;
  localStorage.setItem('ssk_lang', lang);
}

function clearAppData() {
  if(confirm("Are you sure you want to empty your cart and reset your settings?")) {
    localStorage.removeItem('ssk_cart');
    localStorage.removeItem('ssk_theme');
    localStorage.removeItem('ssk_lang');
    cart = [];
    updateCartUI();
    setTheme('dark'); 
    alert("Cart and settings have been cleared!");
    toggleSettings(); 
  }
}

// =========================================
// AUTHENTICATION UI & LOGIC
// =========================================
function openAuthModal() {
  let modal = document.getElementById('auth-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-overlay';
    modal.onclick = function(e) { if(e.target === modal) closeAuthModal(); };
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="auth-modal">
      <button class="auth-close" onclick="closeAuthModal()"><i class="ph-bold ph-x"></i></button>
      <h2 class="auth-title">Login</h2>
      <div class="auth-input-group">
        <label>Email</label>
        <input type="email" id="email-input" class="auth-input" placeholder="Enter your email...">
      </div>
      <div class="auth-input-group">
        <label>Password</label>
        <input type="password" id="password-input" class="auth-input" placeholder="Enter your password...">
      </div>
      <div class="auth-forgot">
        <a href="#" onclick="handleForgotPassword(); return false;">Forgot Password ?</a>
      </div>
      <button class="auth-btn-submit" onclick="handleEmailLogin()">Sign in</button>
      <div class="auth-divider">Login with social accounts</div>
      <div class="auth-social-icons">
        <button class="social-icon-btn" onclick="handleGoogleLogin()"><i class="ph-fill ph-google-logo"></i></button>
        <button class="social-icon-btn" onclick="handleTwitterLogin()"><i class="ph-fill ph-twitter-logo"></i></button>
        <button class="social-icon-btn" onclick="handleGithubLogin()"><i class="ph-fill ph-github-logo"></i></button>
      </div>
    </div>
  `;
  setTimeout(() => modal.classList.add('show'), 10);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('show');
}

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Logged in securely as:", user.email || user.displayName);
    } else {
        console.log("User is not logged in.");
    }
});

function handleEmailLogin() {
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;

  if(!email || !password) return alert("Please enter both email and password.");

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Successfully logged in!");
      closeAuthModal();
    })
    .catch((error) => {
      if(error.code === 'auth/user-not-found') {
          if(confirm("Account not found. Would you like to create a new one?")) {
              auth.createUserWithEmailAndPassword(email, password)
                .then(() => {
                    alert("Account created and logged in!");
                    closeAuthModal();
                })
                .catch((err) => alert("Sign up error: " + err.message));
          }
      } else {
          alert("Login Error: " + error.message);
      }
    });
}

function handleForgotPassword() {
  const email = document.getElementById('email-input').value;
  if (!email) return alert("Please enter your email address in the box first.");
  
  auth.sendPasswordResetEmail(email)
    .then(() => {
        alert("Password reset link sent! Check your inbox.");
        closeAuthModal();
    })
    .catch((error) => alert("Error: " + error.message));
}

function handleGoogleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => closeAuthModal())
    .catch(err => alert("Google Login Error: " + err.message));
}

function handleGithubLogin() {
  const provider = new firebase.auth.GithubAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => closeAuthModal())
    .catch(err => alert("GitHub Login Error: " + err.message));
}

function handleTwitterLogin() {
  alert("Twitter login requires an X Developer Account. Use Google or Email for now!");
}

// =========================================
// INITIALIZE WEBSITE
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  applySavedSettings();
  fetchProducts(); // Pulls live products from database!
  updateCartUI();
});
