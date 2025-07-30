// Application Configuration
const CONFIG = {
  GOOGLE_CLIENT_ID: '856647789843-teunsdqh8coqkicbq1rhgnesqpr5stkl.apps.googleusercontent.com',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
  USER_DATA_FILENAME: 'pk-store-global-users.json',
  WHATSAPP_NUMBER: '9362584929',
  UPI_ID: 'BHARATPE.8R0E0I8U2N09755@fbpe'
};

// Diamond Packages Data
const DIAMOND_PACKAGES = {
  small_packs: [
    { diamonds: 11, price: 25 },
    { diamonds: 14, price: 30 },
    { diamonds: 22, price: 40 },
    { diamonds: 56, price: 85 }
  ],
  medium_packs: [
    { diamonds: 86, price: 115 },
    { diamonds: 172, price: 230 },
    { diamonds: 257, price: 325 },
    { diamonds: 343, price: 430 },
    { diamonds: 429, price: 540 },
    { diamonds: 514, price: 650 },
    { diamonds: 600, price: 750 },
    { diamonds: 706, price: 860 }
  ],
  larger_packs: [
    { diamonds: 1514, price: 1620 },
    { diamonds: 2195, price: 2600 },
    { diamonds: 3688, price: 4400 },
    { diamonds: 5532, price: 6500 },
    { diamonds: 9288, price: 11000 }
  ]
};

// Default Admin User
const DEFAULT_ADMIN = { 
  username: "admin", 
  password: "admin123", 
  role: "admin", 
  lastModified: Date.now() 
};

// Google Drive Sync Class
class DriveSync {
  constructor() {
    this.CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID;
    this.DISCOVERY_DOCS = CONFIG.DISCOVERY_DOCS;
    this.SCOPES = CONFIG.SCOPES;
    this.USER_DATA_FILENAME = CONFIG.USER_DATA_FILENAME;
    this.fileId = null;
    this.isInitialized = false;
    this.isAuthenticated = false;
  }

  async initialize() {
    try {
      if (typeof gapi === 'undefined') {
        console.log('Google API not loaded, sync disabled');
        this.updateSyncStatus('error');
        return false;
      }
      
      await new Promise((resolve) => gapi.load('client:auth2', resolve));
      await gapi.client.init({
        clientId: this.CLIENT_ID,
        discoveryDocs: this.DISCOVERY_DOCS,
        scope: this.SCOPES
      });
      
      this.isInitialized = true;
      this.isAuthenticated = gapi.auth2.getAuthInstance().isSignedIn.get();
      this.updateSyncStatus();
      return true;
    } catch (error) {
      console.error('Drive sync initialization failed:', error);
      this.updateSyncStatus('error');
      return false;
    }
  }

  async getGlobalUsers() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Check if file exists
      const response = await gapi.client.drive.files.list({
        q: `name='${this.USER_DATA_FILENAME}' and trashed=false`,
        fields: 'files(id)'
      });
      
      if (response.result.files.length === 0) {
        // Create new file with default admin user
        return await this.createGlobalUsersFile([DEFAULT_ADMIN]);
      }
      
      this.fileId = response.result.files[0].id;
      
      // Get file content
      const fileResponse = await gapi.client.drive.files.get({
        fileId: this.fileId,
        alt: 'media'
      });
      
      return fileResponse.result;
    } catch (error) {
      console.error('Error getting global users:', error);
      throw error;
    }
  }

  async createGlobalUsersFile(users) {
    try {
      const fileContent = JSON.stringify(users);
      
      const file = await gapi.client.drive.files.create({
        resource: {
          name: this.USER_DATA_FILENAME,
          mimeType: 'application/json'
        },
        media: {
          mimeType: 'application/json',
          body: fileContent
        },
        fields: 'id'
      });
      
      this.fileId = file.result.id;
      return users;
    } catch (error) {
      console.error('Error creating global users file:', error);
      throw error;
    }
  }

  async addNewUser(newUser) {
    try {
      // Get current users
      const users = await this.getGlobalUsers();
      
      // Check if user already exists
      if (users.some(u => u.username === newUser.username)) {
        throw new Error('Username already exists');
      }
      
      // Add new user
      users.push({
        ...newUser,
        lastModified: Date.now()
      });
      
      // Update file
      await gapi.client.drive.files.update({
        fileId: this.fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(users)
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error adding new user:', error);
      throw error;
    }
  }

  async authenticateUser(username, password) {
    try {
      const users = await this.getGlobalUsers();
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      return await this.getGlobalUsers();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUser(updatedUser) {
    try {
      const users = await this.getGlobalUsers();
      const index = users.findIndex(u => u.username === updatedUser.username);
      
      if (index === -1) {
        throw new Error('User not found');
      }
      
      users[index] = {
        ...updatedUser,
        lastModified: Date.now()
      };
      
      await gapi.client.drive.files.update({
        fileId: this.fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(users)
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(username) {
    try {
      const users = await this.getGlobalUsers();
      const filteredUsers = users.filter(u => u.username !== username);
      
      if (filteredUsers.length === users.length) {
        throw new Error('User not found');
      }
      
      await gapi.client.drive.files.update({
        fileId: this.fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(filteredUsers)
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  updateSyncStatus(status = 'disconnected') {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) return;
    
    const statusMap = {
      'connected': { text: '🟢 Drive Connected', class: 'sync-connected' },
      'synced': { text: '✅ Data Synced', class: 'sync-synced' },
      'syncing': { text: '🔄 Syncing...', class: 'sync-syncing' },
      'error': { text: '🔴 Sync Error', class: 'sync-error' },
      'disconnected': { text: '⚫ Local Only', class: 'sync-disconnected' }
    };
    
    const statusInfo = statusMap[status] || statusMap['disconnected'];
    statusElement.textContent = statusInfo.text;
    statusElement.className = `sync-status ${statusInfo.class}`;
  }
}

// Application State
class PKStoreApp {
  constructor() {
    this.driveSync = new DriveSync();
    this.currentUser = null;
    this.isLoggedIn = false;
    this.currentOrder = null;
  }

  async initialize() {
    console.log('Initializing P&K Store App...');
    
    // Initialize Google Drive API
    await this.driveSync.initialize();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Render diamond packages
    this.renderDiamondPackages();
    
    // Check login state from session
    this.checkLoginState();
    
    console.log('App initialization complete');
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin(e);
      });
    }
    
    // Registration
    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-modal').classList.remove('hidden');
      });
    }
    
    const closeRegisterBtn = document.getElementById('close-register');
    if (closeRegisterBtn) {
      closeRegisterBtn.addEventListener('click', () => {
        document.getElementById('register-modal').classList.add('hidden');
      });
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister(e);
      });
    }
    
    // User actions
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
    
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if (adminPanelBtn) {
      adminPanelBtn.addEventListener('click', () => this.showAdminPanel());
    }
    
    const closeAdminBtn = document.getElementById('close-admin');
    if (closeAdminBtn) {
      closeAdminBtn.addEventListener('click', () => this.hideAdminPanel());
    }
    
    // Order modal
    const closeOrderBtn = document.getElementById('close-order');
    if (closeOrderBtn) {
      closeOrderBtn.addEventListener('click', () => this.closeOrderModal());
    }
    
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
      orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendWhatsAppOrder();
      });
    }
    
    // Server ID validation - only numbers
    const serverIdField = document.getElementById('server-id');
    if (serverIdField) {
      serverIdField.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });
      serverIdField.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
          e.preventDefault();
        }
      });
    }
    
    // Close modals on outside click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
      }
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    console.log('Processing login...');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
      this.showNotification('Please enter both username and password', 'error');
      return;
    }
    
    try {
      // Authenticate against global users file
      const user = await this.driveSync.authenticateUser(username, password);
      
      if (user) {
        console.log('Login successful for user:', user.username);
        this.currentUser = user;
        this.isLoggedIn = true;
        
        // Store minimal session info
        sessionStorage.setItem('pk-store-session', JSON.stringify({
          username: user.username,
          timestamp: Date.now()
        }));
        
        this.showStoreContent();
        this.showNotification(`Welcome back, ${user.username}!`, 'success');
      } else {
        console.log('Login failed - invalid credentials');
        this.showNotification('Invalid username or password', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Error during login. Please try again.', 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm').value;
    
    if (!username || !password || !confirmPassword) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showNotification('Passwords do not match', 'error');
      return;
    }
    
    try {
      // Add new user to global file
      await this.driveSync.addNewUser({
        username,
        password,
        role: 'customer'
      });
      
      const modal = document.getElementById('register-modal');
      if (modal) modal.classList.add('hidden');
      
      // Clear form
      document.getElementById('reg-username').value = '';
      document.getElementById('reg-password').value = '';
      document.getElementById('reg-confirm').value = '';
      
      this.showNotification('Account created successfully! Please login.', 'success');
    } catch (error) {
      if (error.message === 'Username already exists') {
        this.showNotification('Username already exists', 'error');
      } else {
        console.error('Registration error:', error);
        this.showNotification('Error creating account. Please try again.', 'error');
      }
    }
  }

  checkLoginState() {
    try {
      const session = sessionStorage.getItem('pk-store-session');
      if (session) {
        const { username, timestamp } = JSON.parse(session);
        
        // Check if session is recent (within 24 hours)
        if (Date.now() - timestamp < 86400000) {
          // Session is valid, set as current user
          this.currentUser = { username }; // Minimal user info
          this.isLoggedIn = true;
          this.showStoreContent();
          console.log('Auto-logged in user:', username);
        } else {
          // Session expired
          sessionStorage.removeItem('pk-store-session');
        }
      }
    } catch (error) {
      console.error('Error checking login state:', error);
      sessionStorage.removeItem('pk-store-session');
    }
  }

  showStoreContent() {
    console.log('Showing store content for user:', this.currentUser.username);
    
    // Hide login section, show store content
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('store-content').classList.remove('hidden');
    
    // Update user info
    document.getElementById('current-user').textContent = this.currentUser.username;
    document.getElementById('user-role').textContent = this.currentUser.role.toUpperCase();
    
    // Show admin panel button if admin
    if (this.currentUser.role === 'admin') {
      document.getElementById('admin-panel-btn').classList.remove('hidden');
    }
  }

  logout() {
    console.log('Logging out user');
    
    this.currentUser = null;
    this.isLoggedIn = false;
    sessionStorage.removeItem('pk-store-session');
    
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('store-content').classList.add('hidden');
    
    // Clear login form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    this.showNotification('Logged out successfully', 'info');
  }

  renderDiamondPackages() {
    console.log('Rendering diamond packages...');
    
    // Render small packs
    const smallContainer = document.getElementById('small-packs');
    if (smallContainer) {
      smallContainer.innerHTML = '';
      DIAMOND_PACKAGES.small_packs.forEach(pack => {
        smallContainer.appendChild(this.createPackageCard(pack));
      });
    }

    // Render medium packs
    const mediumContainer = document.getElementById('medium-packs');
    if (mediumContainer) {
      mediumContainer.innerHTML = '';
      DIAMOND_PACKAGES.medium_packs.forEach(pack => {
        mediumContainer.appendChild(this.createPackageCard(pack));
      });
    }

    // Render larger packs
    const largerContainer = document.getElementById('larger-packs');
    if (largerContainer) {
      largerContainer.innerHTML = '';
      DIAMOND_PACKAGES.larger_packs.forEach(pack => {
        largerContainer.appendChild(this.createPackageCard(pack));
      });
    }
  }

  createPackageCard(pack) {
    const card = document.createElement('div');
    card.className = 'package-card';
    
    card.innerHTML = `
      <div class="package-header">
        <div class="diamond-count">${pack.diamonds} 💎</div>
        <div class="package-price">₹ ${pack.price.toLocaleString()}</div>
      </div>
      <button class="package-btn">Order Now</button>
    `;
    
    // Add click event listener to the button
    const button = card.querySelector('.package-btn');
    button.addEventListener('click', () => {
      this.showOrderModal(`${pack.diamonds} 💎`, `₹ ${pack.price.toLocaleString()}`);
    });
    
    return card;
  }

  showOrderModal(packageName, price) {
    if (!this.isLoggedIn) {
      this.showNotification('Please login first', 'error');
      return;
    }
    
    console.log('Showing order modal for:', packageName);
    
    this.currentOrder = { packageName, price };
    
    document.getElementById('order-package').textContent = packageName;
    document.getElementById('order-price').textContent = price;
    document.getElementById('order-modal').classList.remove('hidden');
  }

  closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
    document.getElementById('mlbb-id').value = '';
    document.getElementById('server-id').value = '';
    document.getElementById('ign').value = '';
    
    this.currentOrder = null;
  }

  sendWhatsAppOrder() {
    const mlbbId = document.getElementById('mlbb-id').value.trim();
    const serverId = document.getElementById('server-id').value.trim();
    const ign = document.getElementById('ign').value.trim();
    
    if (!mlbbId || !serverId || !ign) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }
    
    // Validate server ID is only numbers
    if (!/^\d+$/.test(serverId)) {
      this.showNotification('Server ID must contain only numbers', 'error');
      return;
    }
    
    const message = `🎮 MLBB TOP-UP ORDER

📦 Product: ${this.currentOrder.packageName}
💰 Amount: ${this.currentOrder.price}

👤 Player Details:
🆔 MLBB ID: ${mlbbId}
🌐 Server ID: ${serverId}
🏷️ IGN: ${ign}

💳 Payment: UPI - ${CONFIG.UPI_ID}

Please confirm this order!`;
    
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    this.closeOrderModal();
    this.showNotification('Order sent via WhatsApp!', 'success');
  }

  async showAdminPanel() {
    if (this.currentUser.role !== 'admin') {
      this.showNotification('Access denied', 'error');
      return;
    }
    
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
      await this.renderAdminUsers();
    }
  }

  hideAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
  }

  async handleAddUser() {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value;
    const role = document.getElementById('admin-role').value;
    
    if (!username || !password || !role) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }
    
    try {
      await this.driveSync.addNewUser({
        username,
        password,
        role
      });
      
      // Clear form
      document.getElementById('admin-username').value = '';
      document.getElementById('admin-password').value = '';
      document.getElementById('admin-role').value = '';
      
      await this.renderAdminUsers();
      this.showNotification(`User "${username}" added successfully`, 'success');
    } catch (error) {
      if (error.message === 'Username already exists') {
        this.showNotification('Username already exists', 'error');
      } else {
        console.error('Error adding user:', error);
        this.showNotification('Error adding user. Please try again.', 'error');
      }
    }
  }

  async deleteUser(username) {
    if (username === this.currentUser.username) {
      this.showNotification('Cannot delete your own account', 'error');
      return;
    }
    
    try {
      await this.driveSync.deleteUser(username);
      await this.renderAdminUsers();
      this.showNotification(`User "${username}" deleted`, 'info');
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showNotification('Error deleting user. Please try again.', 'error');
    }
  }

  async renderAdminUsers() {
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    try {
      const users = await this.driveSync.getAllUsers();
      
      users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-user-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.disabled = user.username === this.currentUser.username;
        deleteButton.addEventListener('click', () => this.deleteUser(user.username));
        
        userItem.innerHTML = `
          <div class="user-details">
            <div class="user-name">${user.username}</div>
            <div class="user-meta">${user.role} • Last modified: ${new Date(user.lastModified).toLocaleString()}</div>
          </div>
        `;
        
        userItem.appendChild(deleteButton);
        container.appendChild(userItem);
      });
    } catch (error) {
      console.error('Error rendering admin users:', error);
      this.showNotification('Error loading users. Please try again.', 'error');
    }
  }

  showNotification(message, type = 'info') {
    console.log(`Notification (${type}):`, message);
    
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (!notification || !notificationText) {
      console.log('Notification elements not found');
      return;
    }
    
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 4000);
  }
}

// Global app instance
let app;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing app...');
  
  app = new PKStoreApp();
  await app.initialize();
  
  // Make functions globally available
  window.app = app;
  window.showOrderModal = (packageName, price) => app.showOrderModal(packageName, price);
  window.showWeeklyPassOrder = () => {
    const quantitySelect = document.getElementById('weekly-quantity');
    const quantity = quantitySelect ? quantitySelect.value : '1';
    const totalPrice = 130 * parseInt(quantity);
    app.showOrderModal(`Weekly Pass x${quantity}`, `₹ ${totalPrice.toLocaleString()}`);
  };
  window.copyUpiId = () => {
    navigator.clipboard.writeText(CONFIG.UPI_ID).then(() => {
      app.showNotification('UPI ID copied to clipboard!', 'success');
    }).catch(() => {
      app.showNotification('Failed to copy UPI ID', 'error');
    });
  };
  
  console.log('App ready!');
});
