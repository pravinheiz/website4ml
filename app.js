// Enhanced Application Configuration
const CONFIG = {
  GOOGLE_CLIENT_ID: '856647789843-teunsdqh8coqkicbq1rhgnesqpr5stkl.apps.googleusercontent.com',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
  USER_DATA_FILENAME: 'pk-store-users.json',
  ORDER_HISTORY_FILENAME: 'pk-store-orders.json',
  WHATSAPP_NUMBER: '9362584929',
  UPI_ID: 'BHARATPE.8R0E0I8U2N09755@fbpe',
  ENCRYPTION_KEY: 'secure-encryption-key-123' // In production, use a more secure key
};

// Encryption Utilities
const encryptData = (data) => {
  try {
    // Simple base64 encoding - in production use proper encryption like AES
    return btoa(JSON.stringify(data));
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

const decryptData = (encrypted) => {
  try {
    return JSON.parse(atob(encrypted));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
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

// Default Users
const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "admin", lastModified: Date.now() },
  { username: "customer1", password: "pass123", role: "customer", lastModified: Date.now() },
  { username: "customer2", password: "pass456", role: "customer", lastModified: Date.now() },
  { username: "vip_user", password: "vip789", role: "vip", lastModified: Date.now() }
];

// Default Orders
const DEFAULT_ORDERS = [];

// Enhanced Google Drive Sync Class
class DriveSync {
  constructor() {
    this.CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID;
    this.DISCOVERY_DOCS = CONFIG.DISCOVERY_DOCS;
    this.SCOPES = CONFIG.SCOPES;
    this.USER_DATA_FILENAME = CONFIG.USER_DATA_FILENAME;
    this.ORDER_HISTORY_FILENAME = CONFIG.ORDER_HISTORY_FILENAME;
    this.userFileId = null;
    this.orderFileId = null;
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

  async authenticate() {
    if (!this.isInitialized) {
      console.log('Drive sync not initialized');
      return false;
    }
    
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      this.isAuthenticated = true;
      this.updateSyncStatus('connected');
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      this.updateSyncStatus('error');
      return false;
    }
  }

  async signOut() {
    if (!this.isInitialized) return;
    
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.isAuthenticated = false;
      this.updateSyncStatus('disconnected');
    } catch (error) {
      console.error('Sign out failed:', error);
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

  async syncToDrive(data, filename) {
    if (!this.isAuthenticated) {
      this.showNotification('Not connected to Google Drive', 'error');
      return false;
    }

    this.updateSyncStatus('syncing');
    
    try {
      const encryptedData = encryptData(data);
      if (!encryptedData) throw new Error('Encryption failed');
      
      const fileContent = encryptedData;
      const blob = new Blob([fileContent], { type: 'application/json' });
      const fileId = filename === this.USER_DATA_FILENAME ? this.userFileId : this.orderFileId;
      
      if (fileId) {
        // Update existing file
        const response = await gapi.client.drive.files.update({
          fileId: fileId,
          uploadType: 'media',
          media: {
            mimeType: 'application/json',
            body: blob
          }
        });
        console.log('File updated:', response);
      } else {
        // Create new file
        const response = await gapi.client.drive.files.create({
          resource: {
            name: filename,
            mimeType: 'application/json',
            parents: ['root']
          },
          media: {
            mimeType: 'application/json',
            body: blob
          },
          fields: 'id'
        });
        
        if (filename === this.USER_DATA_FILENAME) {
          this.userFileId = response.result.id;
        } else {
          this.orderFileId = response.result.id;
        }
        console.log('File created:', response);
      }
      
      this.updateSyncStatus('synced');
      return true;
    } catch (error) {
      console.error('Sync to Drive failed:', error);
      this.updateSyncStatus('error');
      return false;
    }
  }

  async loadFromDrive(filename) {
    if (!this.isAuthenticated) {
      this.showNotification('Not connected to Google Drive', 'error');
      return null;
    }

    this.updateSyncStatus('syncing');
    
    try {
      // Search for the file
      const response = await gapi.client.drive.files.list({
        q: `name='${filename}' and trashed=false`,
        fields: 'files(id, name)'
      });
      
      if (response.result.files.length === 0) {
        this.updateSyncStatus('disconnected');
        return null;
      }
      
      const fileId = response.result.files[0].id;
      if (filename === this.USER_DATA_FILENAME) {
        this.userFileId = fileId;
      } else {
        this.orderFileId = fileId;
      }
      
      // Get file content
      const fileResponse = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      
      const decryptedData = decryptData(fileResponse.body);
      if (!decryptedData) throw new Error('Decryption failed');
      
      this.updateSyncStatus('synced');
      return decryptedData;
    } catch (error) {
      console.error('Load from Drive failed:', error);
      this.updateSyncStatus('error');
      return null;
    }
  }

  showNotification(message, type = 'info') {
    if (window.app) {
      window.app.showNotification(message, type);
    }
  }
}

// Enhanced PKStoreApp Class
class PKStoreApp {
  constructor() {
    this.driveSync = new DriveSync();
    this.currentUser = null;
    this.users = [];
    this.orders = [];
    this.isLoggedIn = false;
    this.currentOrder = null;
  }

  async initialize() {
    console.log('Initializing P&K Store App...');
    
    // Initialize Google Drive API first
    const driveInitialized = await this.driveSync.initialize();
    
    if (driveInitialized) {
      // Try to load users from Drive first
      const driveUsers = await this.driveSync.loadFromDrive(CONFIG.USER_DATA_FILENAME);
      if (driveUsers) {
        this.users = driveUsers;
        console.log('Loaded users from Google Drive:', this.users);
      } else {
        // Fall back to local storage
        this.loadLocalUsers();
        console.log('Loaded users from localStorage:', this.users);
        
        // If we have local users but no Drive file, sync to Drive
        if (this.users.length > 0 && this.driveSync.isAuthenticated) {
          await this.driveSync.syncToDrive(this.users, CONFIG.USER_DATA_FILENAME);
        }
      }

      // Try to load orders from Drive
      const driveOrders = await this.driveSync.loadFromDrive(CONFIG.ORDER_HISTORY_FILENAME);
      if (driveOrders) {
        this.orders = driveOrders;
        console.log('Loaded orders from Google Drive:', this.orders);
      } else {
        // Fall back to local storage
        this.loadLocalOrders();
        console.log('Loaded orders from localStorage:', this.orders);
        
        // If we have local orders but no Drive file, sync to Drive
        if (this.orders.length > 0 && this.driveSync.isAuthenticated) {
          await this.driveSync.syncToDrive(this.orders, CONFIG.ORDER_HISTORY_FILENAME);
        }
      }
    } else {
      // Drive not available, use local storage
      this.loadLocalUsers();
      this.loadLocalOrders();
      console.log('Loaded users and orders from localStorage');
    }
    
    // Setup event listeners
    this.setupEventListeners();
    console.log('Event listeners setup complete');
    
    // Render diamond packages
    this.renderDiamondPackages();
    console.log('Diamond packages rendered');
    
    // Check login state
    this.checkLoginState();
    console.log('Login state checked');
    
    console.log('App initialization complete');
  }

  loadLocalUsers() {
    try {
      const stored = localStorage.getItem('pk-store-users');
      if (stored) {
        this.users = JSON.parse(stored);
        console.log('Loaded users from localStorage:', this.users);
      } else {
        this.users = [...DEFAULT_USERS];
        this.saveLocalUsers();
        console.log('Created default users:', this.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [...DEFAULT_USERS];
      this.saveLocalUsers();
    }
  }

  loadLocalOrders() {
    try {
      const stored = localStorage.getItem('pk-store-orders');
      if (stored) {
        this.orders = JSON.parse(stored);
        console.log('Loaded orders from localStorage:', this.orders);
      } else {
        this.orders = [...DEFAULT_ORDERS];
        this.saveLocalOrders();
        console.log('Created default orders:', this.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.orders = [...DEFAULT_ORDERS];
      this.saveLocalOrders();
    }
  }

  saveLocalUsers() {
    try {
      localStorage.setItem('pk-store-users', JSON.stringify(this.users));
      console.log('Saved users to localStorage');
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  saveLocalOrders() {
    try {
      localStorage.setItem('pk-store-orders', JSON.stringify(this.orders));
      console.log('Saved orders to localStorage');
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  async saveUsers() {
    // Save to local storage
    this.saveLocalUsers();
    
    // Sync to Drive if authenticated
    if (this.driveSync.isAuthenticated) {
      await this.driveSync.syncToDrive(this.users, CONFIG.USER_DATA_FILENAME);
    }
  }

  async saveOrders() {
    // Save to local storage
    this.saveLocalOrders();
    
    // Sync to Drive if authenticated
    if (this.driveSync.isAuthenticated) {
      await this.driveSync.syncToDrive(this.orders, CONFIG.ORDER_HISTORY_FILENAME);
    }
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        this.handleLogin(e);
      });
    }
    
    // Registration
    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById('register-modal');
        if (modal) modal.classList.remove('hidden');
      });
    }
    
    const closeRegisterBtn = document.getElementById('close-register');
    if (closeRegisterBtn) {
      closeRegisterBtn.addEventListener('click', () => {
        const modal = document.getElementById('register-modal');
        if (modal) modal.classList.add('hidden');
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
    
    // Google Drive connection
    const connectDriveBtn = document.getElementById('connect-drive-btn');
    if (connectDriveBtn) {
      connectDriveBtn.addEventListener('click', () => this.toggleDriveConnection());
    }
    
    // Admin functions
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => this.handleAddUser());
    }
    
    // Sync controls
    const syncToDriveBtn = document.getElementById('sync-to-drive');
    if (syncToDriveBtn) {
      syncToDriveBtn.addEventListener('click', async () => {
        this.showNotification('Syncing to Google Drive...', 'info');
        const successUsers = await this.driveSync.syncToDrive(this.users, CONFIG.USER_DATA_FILENAME);
        const successOrders = await this.driveSync.syncToDrive(this.orders, CONFIG.ORDER_HISTORY_FILENAME);
        if (successUsers && successOrders) {
          this.showNotification('Data synced to Google Drive!', 'success');
        }
      });
    }
    
    const loadFromDriveBtn = document.getElementById('load-from-drive');
    if (loadFromDriveBtn) {
      loadFromDriveBtn.addEventListener('click', async () => {
        this.showNotification('Loading from Google Drive...', 'info');
        const driveUsers = await this.driveSync.loadFromDrive(CONFIG.USER_DATA_FILENAME);
        const driveOrders = await this.driveSync.loadFromDrive(CONFIG.ORDER_HISTORY_FILENAME);
        if (driveUsers) {
          this.users = driveUsers;
          this.saveLocalUsers();
        }
        if (driveOrders) {
          this.orders = driveOrders;
          this.saveLocalOrders();
        }
        this.renderAdminUsers();
        this.renderAdminOrders();
        this.showNotification('Data loaded from Google Drive!', 'success');
      });
    }
    
    const forceSyncBtn = document.getElementById('force-sync');
    if (forceSyncBtn) {
      forceSyncBtn.addEventListener('click', async () => {
        this.showNotification('Forcing sync with Google Drive...', 'info');
        await this.driveSync.syncToDrive(this.users, CONFIG.USER_DATA_FILENAME);
        await this.driveSync.syncToDrive(this.orders, CONFIG.ORDER_HISTORY_FILENAME);
        const driveUsers = await this.driveSync.loadFromDrive(CONFIG.USER_DATA_FILENAME);
        const driveOrders = await this.driveSync.loadFromDrive(CONFIG.ORDER_HISTORY_FILENAME);
        if (driveUsers && driveOrders) {
          this.users = driveUsers;
          this.orders = driveOrders;
          this.saveLocalUsers();
          this.saveLocalOrders();
          this.renderAdminUsers();
          this.renderAdminOrders();
          this.showNotification('Force sync completed!', 'success');
        }
      });
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
        this.handleOrderSubmit();
      });
    }
    
    // Server ID validation
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
    
    // Responsive menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.classList.toggle('hidden');
        }
      });
    }
    
    console.log('Event listeners setup completed');
  }

  handleLogin(e) {
    e.preventDefault();
    console.log('Processing login...');
    
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    if (!usernameField || !passwordField) {
      console.error('Username or password field not found');
      this.showNotification('Login form error', 'error');
      return;
    }
    
    const username = usernameField.value.trim();
    const password = passwordField.value;
    
    console.log('Login attempt for username:', username);
    console.log('Available users:', this.users.map(u => u.username));
    
    if (!username || !password) {
      this.showNotification('Please enter both username and password', 'error');
      return;
    }
    
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      console.log('Login successful for user:', user.username);
      this.currentUser = user;
      this.isLoggedIn = true;
      localStorage.setItem('pk-store-current-user', JSON.stringify(user));
      this.showStoreContent();
      this.showNotification(`Welcome back, ${user.username}!`, 'success');
    } else {
      console.log('Login failed - invalid credentials');
      this.showNotification('Invalid username or password', 'error');
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
    
    if (this.users.find(u => u.username === username)) {
      this.showNotification('Username already exists', 'error');
      return;
    }
    
    const newUser = {
      username,
      password,
      role: 'customer',
      lastModified: Date.now()
    };
    
    this.users.push(newUser);
    await this.saveUsers();
    
    const modal = document.getElementById('register-modal');
    if (modal) modal.classList.add('hidden');
    
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-confirm').value = '';
    
    this.showNotification('Account created successfully! Please login.', 'success');
  }

  showStoreContent() {
    console.log('Showing store content for user:', this.currentUser.username);
    
    const loginSection = document.getElementById('login-section');
    const storeContent = document.getElementById('store-content');
    
    if (loginSection) {
      loginSection.classList.add('hidden');
      console.log('Login section hidden');
    }
    if (storeContent) {
      storeContent.classList.remove('hidden');
      console.log('Store content shown');
    }
    
    // Update user info
    const currentUserSpan = document.getElementById('current-user');
    const userRoleSpan = document.getElementById('user-role');
    if (currentUserSpan) {
      currentUserSpan.textContent = this.currentUser.username;
    }
    if (userRoleSpan) {
      userRoleSpan.textContent = this.currentUser.role.toUpperCase();
    }
    
    // Show admin panel button if admin
    if (this.currentUser.role === 'admin') {
      const adminPanelBtn = document.getElementById('admin-panel-btn');
      if (adminPanelBtn) {
        adminPanelBtn.classList.remove('hidden');
      }
    }
  }

  logout() {
    console.log('Logging out user');
    this.currentUser = null;
    this.isLoggedIn = false;
    localStorage.removeItem('pk-store-current-user');
    
    const loginSection = document.getElementById('login-section');
    const storeContent = document.getElementById('store-content');
    const adminPanel = document.getElementById('admin-panel');
    
    if (loginSection) {
      loginSection.classList.remove('hidden');
    }
    if (storeContent) {
      storeContent.classList.add('hidden');
    }
    if (adminPanel) {
      adminPanel.classList.add('hidden');
    }
    
    // Clear login form
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    if (usernameField) usernameField.value = '';
    if (passwordField) passwordField.value = '';
    
    this.showNotification('Logged out successfully', 'info');
  }

  checkLoginState() {
    try {
      const storedUser = localStorage.getItem('pk-store-current-user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        // Verify user still exists
        if (this.users.find(u => u.username === user.username)) {
          this.currentUser = user;
          this.isLoggedIn = true;
          this.showStoreContent();
          console.log('Auto-logged in user:', user.username);
        } else {
          localStorage.removeItem('pk-store-current-user');
        }
      }
    } catch (error) {
      console.error('Error checking login state:', error);
      localStorage.removeItem('pk-store-current-user');
    }
  }

  async toggleDriveConnection() {
    if (!this.driveSync.isAuthenticated) {
      this.showNotification('Connecting to Google Drive...', 'info');
      const success = await this.driveSync.authenticate();
      if (success) {
        document.getElementById('connect-drive-btn').textContent = 'Disconnect Drive';
        this.showNotification('Connected to Google Drive!', 'success');
        
        // After connecting, sync local data to Drive
        await this.driveSync.syncToDrive(this.users, CONFIG.USER_DATA_FILENAME);
        await this.driveSync.syncToDrive(this.orders, CONFIG.ORDER_HISTORY_FILENAME);
      } else {
        this.showNotification('Failed to connect to Google Drive', 'error');
      }
    } else {
      await this.driveSync.signOut();
      document.getElementById('connect-drive-btn').textContent = 'Connect Drive';
      this.showNotification('Disconnected from Google Drive', 'info');
    }
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
        <div class="diamond-count">${pack.diamonds.toLocaleString()} 💎</div>
        <div class="package-price">₹ ${pack.price.toLocaleString()}</div>
      </div>
      <button class="package-btn" type="button" onclick="showOrderModal('${pack.diamonds} Diamonds', '₹ ${pack.price.toLocaleString()}')">Buy Now</button>
    `;
    return card;
  }

  showOrderModal(packageName, price) {
    if (!this.isLoggedIn) {
      this.showNotification('Please login to place an order', 'error');
      return;
    }
    
    this.currentOrder = { packageName, price };
    
    const modal = document.getElementById('order-modal');
    const itemName = document.getElementById('order-item-name');
    const itemPrice = document.getElementById('order-item-price');
    
    if (modal && itemName && itemPrice) {
      itemName.textContent = packageName;
      itemPrice.textContent = price;
      modal.classList.remove('hidden');
    }
  }

  closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.currentOrder = null;
  }

  async handleOrderSubmit() {
    if (!this.currentOrder || !this.currentUser) return;
    
    const serverIdField = document.getElementById('server-id');
    const serverId = serverIdField ? serverIdField.value.trim() : '';
    
    if (!serverId) {
      this.showNotification('Please enter your server ID', 'error');
      return;
    }
    
    // Create order object
    const newOrder = {
      id: Date.now().toString(),
      username: this.currentUser.username,
      package: this.currentOrder.packageName,
      price: this.currentOrder.price,
      serverId,
      date: new Date().toISOString(),
      status: 'pending'
    };
    
    // Add to orders array
    this.orders.push(newOrder);
    
    // Save orders
    await this.saveOrders();
    
    // Send WhatsApp message
    this.sendWhatsAppOrder(newOrder);
    
    // Close modal
    this.closeOrderModal();
    
    // Show success message
    this.showNotification('Order placed successfully!', 'success');
    
    // If admin, refresh orders list
    if (this.currentUser.role === 'admin') {
      this.renderAdminOrders();
    }
  }

  sendWhatsAppOrder(order) {
    const message = `Hi! I would like to order:\n${order.package}\nPrice: ${order.price}\nServer ID: ${order.serverId}\nUsername: ${order.username}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  }

  async handleAddUser() {
    const usernameField = document.getElementById('admin-username');
    const passwordField = document.getElementById('admin-password');
    const roleField = document.getElementById('admin-role');
    
    if (!usernameField || !passwordField || !roleField) {
      this.showNotification('Admin form fields not found', 'error');
      return;
    }
    
    const username = usernameField.value.trim();
    const password = passwordField.value;
    const role = roleField.value;
    
    if (!username || !password || !role) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }
    
    if (this.users.find(u => u.username === username)) {
      this.showNotification('Username already exists', 'error');
      return;
    }
    
    const newUser = {
      username,
      password,
      role,
      lastModified: Date.now()
    };
    
    this.users.push(newUser);
    await this.saveUsers();
    
    usernameField.value = '';
    passwordField.value = '';
    roleField.value = '';
    
    this.renderAdminUsers();
    this.showNotification(`User "${username}" added successfully`, 'success');
  }

  async deleteUser(username) {
    if (username === this.currentUser.username) {
      this.showNotification('Cannot delete your own account', 'error');
      return;
    }
    
    this.users = this.users.filter(u => u.username !== username);
    await this.saveUsers();
    
    this.renderAdminUsers();
    this.showNotification(`User "${username}" deleted`, 'info');
  }

  async updateOrderStatus(orderId, status) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      await this.saveOrders();
      this.renderAdminOrders();
      this.showNotification(`Order ${orderId} status updated to ${status}`, 'success');
    }
  }

  renderAdminUsers() {
    const list = document.getElementById('admin-users-list');
    if (!list) return;
    
    list.innerHTML = '';
    this.users.forEach(user => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      userItem.innerHTML = `
        <div class="user-details">
          <span class="user-name">${user.username}</span>
          <span class="user-meta">Role: ${user.role}</span>
          <span class="user-meta">Last Modified: ${new Date(user.lastModified).toLocaleString()}</span>
        </div>
        <button class="delete-user-btn" ${user.username === this.currentUser.username ? 'disabled' : ''} title="Delete user ${user.username}">Delete</button>
      `;
      
      const deleteBtn = userItem.querySelector('.delete-user-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => this.deleteUser(user.username));
      }
      
      list.appendChild(userItem);
    });
  }

  renderAdminOrders() {
    const list = document.getElementById('admin-orders-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    // Sort orders by date (newest first)
    const sortedOrders = [...this.orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOrders.forEach(order => {
      const orderItem = document.createElement('div');
      orderItem.className = 'order-item';
      
      const statusClass = `status-${order.status.toLowerCase()}`;
      
      orderItem.innerHTML = `
        <div class="order-details">
          <div class="order-header">
            <span class="order-id">#${order.id.slice(-6)}</span>
            <span class="order-date">${new Date(order.date).toLocaleString()}</span>
          </div>
          <div class="order-body">
            <div class="order-info">
              <span class="order-username">${order.username}</span>
              <span class="order-package">${order.package}</span>
              <span class="order-price">${order.price}</span>
            </div>
            <div class="order-server-id">Server ID: ${order.serverId}</div>
          </div>
        </div>
        <div class="order-actions">
          <span class="order-status ${statusClass}">${order.status}</span>
          <div class="status-buttons">
            <button class="status-btn status-pending" data-status="pending">Pending</button>
            <button class="status-btn status-processing" data-status="processing">Processing</button>
            <button class="status-btn status-completed" data-status="completed">Completed</button>
          </div>
        </div>
      `;
      
      // Add event listeners to status buttons
      const statusButtons = orderItem.querySelectorAll('.status-btn');
      statusButtons.forEach(button => {
        button.addEventListener('click', () => {
          this.updateOrderStatus(order.id, button.dataset.status);
        });
      });
      
      list.appendChild(orderItem);
    });
  }

  showAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
      this.renderAdminUsers();
      this.renderAdminOrders();
    }
  }

  hideAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.add('hidden');
    }
  }

  showNotification(message, type = 'info') {
    const notifEl = document.getElementById('notification');
    const textEl = document.getElementById('notification-text');
    if (!notifEl || !textEl) return;
    
    notifEl.className = `notification ${type}`;
    textEl.textContent = message;
    notifEl.classList.remove('hidden');
    
    setTimeout(() => {
      notifEl.classList.add('hidden');
    }, 3000);
  }
}

// Global Functions
function showOrderModal(packageName, price) {
  if (window.app) window.app.showOrderModal(packageName, price);
}

function showWeeklyPassOrder() {
  const quantitySelect = document.getElementById('weekly-quantity');
  const quantity = quantitySelect ? quantitySelect.value : '1';
  const totalPrice = 130 * parseInt(quantity);
  
  if (window.app) window.app.showOrderModal(`Weekly Pass x${quantity}`, `₹ ${totalPrice.toLocaleString()}`);
}

function copyUpiId() {
  navigator.clipboard.writeText(CONFIG.UPI_ID).then(() => {
    if (window.app) window.app.showNotification('UPI ID copied to clipboard!', 'success');
  }).catch(() => {
    if (window.app) window.app.showNotification('Failed to copy UPI ID', 'error');
  });
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
  window.showOrderModal = showOrderModal;
  window.showWeeklyPassOrder = showWeeklyPassOrder;
  window.copyUpiId = copyUpiId;
  
  console.log('App ready!');
});

// Debug function to check users
window.debugUsers = () => {
  if (window.app) {
    console.log('Current users:', window.app.users);
    console.log('Current user:', window.app.currentUser);
    console.log('Is logged in:', window.app.isLoggedIn);
    console.log('Orders:', window.app.orders);
  }
};
