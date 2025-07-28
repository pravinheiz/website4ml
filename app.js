// Application State
let currentUser = null;
let currentProduct = '';
let currentPrice = '';
let sessionTimeout = null;

// Authorized Users List (stored in localStorage)
const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "admin", protected: true },
  { username: "customer1", password: "pass123", role: "customer", protected: false },
  { username: "customer2", password: "pass456", role: "customer", protected: false },
  { username: "vip_user", password: "vip789", role: "vip", protected: false }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
});

function initializeApp() {
  // Initialize authorized users if not exists
  if (!localStorage.getItem('mlbb_authorized_users')) {
    localStorage.setItem('mlbb_authorized_users', JSON.stringify(DEFAULT_USERS));
  }
  
  // Check for existing session
  checkExistingSession();
  
  // Set up session timeout (30 minutes)
  resetSessionTimeout();
}

function setupEventListeners() {
  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Admin panel button
  document.getElementById('admin-panel-btn').addEventListener('click', openAdminModal);
  
  // Add user form
  document.getElementById('add-user-form').addEventListener('submit', handleAddUser);
  
  // Order buttons
  setupOrderButtons();
  
  // File upload display
  document.getElementById('payment-ss').addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name || 'No file selected';
    document.getElementById('file-name').textContent = fileName;
  });
  
  // Order form
  document.getElementById('order-form').addEventListener('submit', processOrder);
  
  // Server input validation
  document.getElementById('server').addEventListener('input', function() {
    const serverInput = this;
    if(/\D/.test(serverInput.value)) {
      serverInput.style.borderColor = '#e74c3c';
    } else {
      serverInput.style.borderColor = 'rgba(255,255,255,0.2)';
    }
  });
  
  // Reset session timeout on user activity
  document.addEventListener('click', resetSessionTimeout);
  document.addEventListener('keypress', resetSessionTimeout);
}

// Authentication Functions
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('login-error');
  
  // Clear previous errors
  errorElement.classList.remove('show');
  
  if (!username || !password) {
    showError('Please fill in all fields');
    return;
  }
  
  // Get authorized users from localStorage
  const authorizedUsers = JSON.parse(localStorage.getItem('mlbb_authorized_users') || '[]');
  
  // Find user
  const user = authorizedUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Successful login
    currentUser = { ...user };
    delete currentUser.password; // Don't store password in session
    
    // Store session
    localStorage.setItem('userSession', JSON.stringify({
      user: currentUser,
      loginTime: Date.now()
    }));
    
    showStore();
    resetSessionTimeout();
  } else {
    showError('Invalid username or password');
  }
}

function handleLogout() {
  // Clear session
  localStorage.removeItem('userSession');
  currentUser = null;
  
  // Clear session timeout
  if (sessionTimeout) {
    clearTimeout(sessionTimeout);
    sessionTimeout = null;
  }
  
  // Show login page
  showLogin();
}

function checkExistingSession() {
  const session = localStorage.getItem('userSession');
  if (session) {
    try {
      const sessionData = JSON.parse(session);
      const loginTime = sessionData.loginTime;
      const currentTime = Date.now();
      
      // Check if session is expired (30 minutes)
      if (currentTime - loginTime < 30 * 60 * 1000) {
        currentUser = sessionData.user;
        showStore();
        resetSessionTimeout();
      } else {
        // Session expired
        localStorage.removeItem('userSession');
        showLogin();
      }
    } catch (error) {
      console.error('Session parsing error:', error);
      showLogin();
    }
  } else {
    showLogin();
  }
}

function resetSessionTimeout() {
  if (sessionTimeout) {
    clearTimeout(sessionTimeout);
  }
  
  if (currentUser) {
    sessionTimeout = setTimeout(() => {
      alert('Session expired. Please login again.');
      handleLogout();
    }, 30 * 60 * 1000); // 30 minutes
  }
}

function showError(message) {
  const errorElement = document.getElementById('login-error');
  errorElement.textContent = message;
  errorElement.classList.add('show');
}

function showLogin() {
  document.getElementById('login-container').classList.remove('hidden');
  document.getElementById('store-container').classList.add('hidden');
  
  // Clear form
  document.getElementById('login-form').reset();
  document.getElementById('login-error').classList.remove('show');
}

function showStore() {
  document.getElementById('login-container').classList.add('hidden');
  document.getElementById('store-container').classList.remove('hidden');
  
  updateUserInterface();
}

function updateUserInterface() {
  if (!currentUser) return;
  
  // Update user display
  document.getElementById('username-display').textContent = currentUser.username;
  document.getElementById('user-role').textContent = currentUser.role;
  
  // Show admin panel button for admin users
  if (currentUser.role === 'admin') {
    document.getElementById('admin-panel-btn').classList.remove('hidden');
  } else {
    document.getElementById('admin-panel-btn').classList.add('hidden');
  }
  
  // Apply role-specific styling
  const roleElement = document.getElementById('user-role');
  roleElement.className = 'user-role';
  if (currentUser.role === 'admin') {
    roleElement.style.background = '#e74c3c';
  } else if (currentUser.role === 'vip') {
    roleElement.style.background = '#FFD700';
    roleElement.style.color = '#1A1A2E';
  } else {
    roleElement.style.background = '#FF4655';
  }
}

// Admin Panel Functions
function openAdminModal() {
  document.getElementById('admin-modal').classList.remove('hidden');
  loadUsersList();
}

function closeAdminModal() {
  document.getElementById('admin-modal').classList.add('hidden');
  document.getElementById('add-user-form').reset();
}

function loadUsersList() {
  const authorizedUsers = JSON.parse(localStorage.getItem('mlbb_authorized_users') || '[]');
  const usersList = document.getElementById('users-list');
  
  usersList.innerHTML = '';
  
  authorizedUsers.forEach((user, index) => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    
    userItem.innerHTML = `
      <div class="user-info">
        <span class="user-name">${user.username}</span>
        <span class="user-role-badge">${user.role}</span>
      </div>
      <button class="remove-user-btn" onclick="removeUser(${index})" 
              ${user.protected ? 'disabled title="Cannot remove protected user"' : ''}>
        Remove
      </button>
    `;
    
    usersList.appendChild(userItem);
  });
}

function handleAddUser(e) {
  e.preventDefault();
  
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value;
  const role = document.getElementById('new-role').value;
  
  if (!username || !password || !role) {
    alert('Please fill in all fields');
    return;
  }
  
  const authorizedUsers = JSON.parse(localStorage.getItem('mlbb_authorized_users') || '[]');
  
  // Check if username already exists
  if (authorizedUsers.find(u => u.username === username)) {
    alert('Username already exists');
    return;
  }
  
  // Add new user
  authorizedUsers.push({ username, password, role, protected: false });
  localStorage.setItem('mlbb_authorized_users', JSON.stringify(authorizedUsers));
  
  // Reset form and reload list
  document.getElementById('add-user-form').reset();
  loadUsersList();
  
  alert('User added successfully');
}

function removeUser(index) {
  const authorizedUsers = JSON.parse(localStorage.getItem('mlbb_authorized_users') || '[]');
  const userToRemove = authorizedUsers[index];
  
  if (userToRemove.protected) {
    alert('Cannot remove protected user');
    return;
  }
  
  if (confirm(`Are you sure you want to remove user "${userToRemove.username}"?`)) {
    authorizedUsers.splice(index, 1);
    localStorage.setItem('mlbb_authorized_users', JSON.stringify(authorizedUsers));
    loadUsersList();
  }
}

// Order System Functions
function setupOrderButtons() {
  document.querySelectorAll('.order-btn').forEach(btn => {
    if (btn.getAttribute('data-product')) {
      btn.addEventListener('click', function() {
        if (!currentUser) {
          alert('Please login to place an order');
          return;
        }
        
        const product = this.getAttribute('data-product');
        const price = this.getAttribute('data-price');
        verifyBeforePayment(product, price);
      });
    }
  });
}

function verifyBeforePayment(product, price) {
  currentProduct = product;
  currentPrice = price;
  
  document.getElementById('verify-product').textContent = product;
  document.getElementById('verify-price').textContent = `₹ ${formatPrice(price)}`;
  document.getElementById('verification-popup').classList.remove('hidden');
}

function closeVerification() {
  document.getElementById('verification-popup').classList.add('hidden');
}

function proceedToPayment() {
  closeVerification();
  openOrderModal(currentProduct, currentPrice);
}

function openOrderModal(productName, price) {
  document.getElementById('product-name').value = productName;
  document.getElementById('product-price').value = price;
  document.getElementById('order-modal').classList.remove('hidden');
  document.getElementById('file-name').textContent = '';
  document.getElementById('order-form').reset();
  
  // Restore hidden values after reset
  document.getElementById('product-name').value = productName;
  document.getElementById('product-price').value = price;
}

function closeOrderModal() {
  document.getElementById('order-modal').classList.add('hidden');
}

// Utility Functions
function copyUPI() {
  const upiId = "BHARATPE.8R0E0I8U2N09755@fbpe";
  navigator.clipboard.writeText(upiId).then(() => {
    alert("UPI ID copied to clipboard: " + upiId);
  }).catch(err => {
    console.error("Failed to copy: ", err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = upiId;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert("UPI ID copied to clipboard: " + upiId);
  });
}

function formatPrice(price) {
  const numPrice = parseInt(price);
  if (numPrice >= 1000) {
    return numPrice.toLocaleString('en-IN');
  }
  return price;
}

// Quantity Control for Weekly Pass
function adjustQuantity(type, change) {
  const input = document.getElementById(`${type}-qty`);
  let newVal = parseInt(input.value) + change;
  newVal = Math.max(1, Math.min(10, newVal));
  input.value = newVal;
}

function orderWeekly() {
  if (!currentUser) {
    alert('Please login to place an order');
    return;
  }
  
  const quantity = parseInt(document.getElementById("weekly-qty").value);
  const totalPrice = 130 * quantity;
  verifyBeforePayment(
    `${quantity} Weekly Pass${quantity > 1 ? 'es' : ''}`, 
    totalPrice
  );
}

// Order Processing
function processOrder(e) {
  e.preventDefault();
  
  const serverInput = document.getElementById('server');
  if(/\D/.test(serverInput.value)) {
    serverInput.style.borderColor = '#e74c3c';
    alert('Server ID must contain only numbers');
    return false;
  }
  
  const product = document.getElementById("product-name").value;
  const price = document.getElementById("product-price").value;
  const uid = document.getElementById("uid").value;
  const server = serverInput.value;
  const ign = document.getElementById("ign").value;
  const file = document.getElementById("payment-ss").files[0];
  
  if (!file) {
    alert('Please upload payment screenshot');
    return false;
  }
  
  const yourNumber = "9362584929";
  const formattedPrice = formatPrice(price);
  
  const message = `*MLBB TOP-UP ORDER*%0A%0A` +
                 `📦 Product: ${product}%0A` +
                 `💵 Amount Paid: ₹${formattedPrice}%0A` +
                 `📱 Paid to: BHARATPE.8R0E0I8U2N09755@fbpe%0A%0A` +
                 `👤 Player Details:%0A` +
                 `🆔 ID: ${uid}%0A` +
                 `🌐 Server ID: ${server}%0A` +
                 `🏷️ IGN: ${ign}%0A` +
                 `👤 Ordered by: ${currentUser.username} (${currentUser.role})%0A%0A` +
                 `📸 Payment screenshot attached below`;
  
  window.open(`https://wa.me/${yourNumber}?text=${message}`, "_blank");
  closeOrderModal();
  
  alert("Please send the payment screenshot in the WhatsApp chat that opened.");
}

// Global Functions (needed for onclick handlers in HTML)
window.copyUPI = copyUPI;
window.adjustQuantity = adjustQuantity;
window.orderWeekly = orderWeekly;
window.verifyBeforePayment = verifyBeforePayment;
window.closeVerification = closeVerification;
window.proceedToPayment = proceedToPayment;
window.closeOrderModal = closeOrderModal;
window.processOrder = processOrder;
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.removeUser = removeUser;