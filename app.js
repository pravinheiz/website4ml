// Application Configuration
const CONFIG = {
  GOOGLE_CLIENT_ID: '856647789843-teunsdqh8coqkicbq1rhgnesqpr5stkl.apps.googleusercontent.com',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
  USER_DATA_FILENAME: 'pk-store-users.json',
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

// Default Users
const DEFAULT_USERS = [
  { username: "admin", password: "admin123", role: "admin", lastModified: Date.now() },
  { username: "customer1", password: "pass123", role: "customer", lastModified: Date.now() },
  { username: "customer2", password: "pass456", role: "customer", lastModified: Date.now() },
  { username: "vip_user", password: "vip789", role: "vip", lastModified: Date.now() }
];

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

  async findUserDataFile() {
    try {
      const response = await gapi.client.drive.files.list({
        q: `name='${this.USER_DATA_FILENAME}' and trashed=false`,
        spaces: 'drive'
      });
      
      if (response.result.files.length > 0) {
        this.fileId = response.result.files[0].id;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error finding user data file:', error);
      return false;
    }
  }

  async createFile(data) {
    const fileMetadata = {
      name: this.USER_DATA_FILENAME,
      parents: ['appDataFolder']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
    form.append('file', new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}` }),
      body: form
    });

    const result = await response.json();
    this.fileId = result.id;
    return result;
  }

  async updateFile(data) {
    const form = new FormData();
    form.append('file', new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));

    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: new Headers({ 'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}` }),
      body: form
    });

    return await response.json();
  }

  async syncToCloud(userData) {
    if (!this.isAuthenticated) return false;
    
    try {
      this.updateSyncStatus('syncing');
      
      const dataWithTimestamp = userData.map(user => ({
        ...user,
        lastModified: user.lastModified || Date.now()
      }));

      if (this.fileId) {
        await this.updateFile(dataWithTimestamp);
      } else {
        await this.findUserDataFile();
        if (this.fileId) {
          await this.updateFile(dataWithTimestamp);
        } else {
          await this.createFile(dataWithTimestamp);
        }
      }
      
      this.updateSyncStatus('synced');
      return true;
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      this.updateSyncStatus('error');
      return false;
    }
  }

  async syncFromCloud() {
    if (!this.isAuthenticated) return null;
    
    try {
      this.updateSyncStatus('syncing');
      
      await this.findUserDataFile();
      if (!this.fileId) return null;
      
      const response = await gapi.client.drive.files.get({
        fileId: this.fileId,
        alt: 'media'
      });
      
      this.updateSyncStatus('synced');
      return JSON.parse(response.body);
    } catch (error) {
      console.error('Failed to load from cloud:', error);
      this.updateSyncStatus('error');
      return null;
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
    this.users = [];
    this.isLoggedIn = false;
    this.currentOrder = null;
  }

  async initialize() {
    console.log('Initializing P&K Store App...');
    
    // Load users from localStorage first
    this.loadLocalUsers();
    console.log('Users loaded:', this.users.length);
    
    // Initialize Google Drive API (non-blocking)
    this.driveSync.initialize().then(() => {
      console.log('Drive sync initialized');
      // Try to merge with cloud data if authenticated
      if (this.driveSync.isAuthenticated) {
        this.syncUserData();
      }
    });
    
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
      } else {
        this.users = [...DEFAULT_USERS];
        this.saveLocalUsers();
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [...DEFAULT_USERS];
      this.saveLocalUsers();
    }
  }

  saveLocalUsers() {
    try {
      localStorage.setItem('pk-store-users', JSON.stringify(this.users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  async syncUserData() {
    try {
      if (!this.driveSync.isAuthenticated) return false;

      // Try to load from cloud
      const cloudData = await this.driveSync.syncFromCloud();
      
      if (cloudData) {
        // Merge local and cloud data
        const mergedUsers = this.mergeUserData(this.users, cloudData);
        this.users = mergedUsers;
        this.saveLocalUsers();
      } else {
        // No cloud data, upload local data
        await this.driveSync.syncToCloud(this.users);
      }
      
      if (this.currentUser && this.currentUser.role === 'admin') {
        this.renderAdminUsers();
      }
      
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      this.showNotification('Sync failed: ' + error.message, 'error');
      return false;
    }
  }

  mergeUserData(localData, cloudData) {
    const merged = [...cloudData];
    
    localData.forEach(localUser => {
      const existingIndex = merged.findIndex(u => u.username === localUser.username);
      
      if (existingIndex >= 0) {
        // User exists, keep most recent version based on lastModified
        if (!merged[existingIndex].lastModified || 
            (localUser.lastModified && localUser.lastModified > merged[existingIndex].lastModified)) {
          merged[existingIndex] = localUser;
        }
      } else {
        // New user, add to merged data
        merged.push(localUser);
      }
    });

    return merged;
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
      console.log('Login form listener added');
    }
    
    // Registration
    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById('register-modal');
        if (modal) {
          modal.classList.remove('hidden');
        }
      });
      console.log('Show register listener added');
    }
    
    const closeRegisterBtn = document.getElementById('close-register');
    if (closeRegisterBtn) {
      closeRegisterBtn.addEventListener('click', () => {
        const modal = document.getElementById('register-modal');
        if (modal) {
          modal.classList.add('hidden');
        }
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
    
    const syncToDriveBtn = document.getElementById('sync-to-drive');
    if (syncToDriveBtn) {
      syncToDriveBtn.addEventListener('click', () => this.syncToCloud());
    }
    
    const loadFromDriveBtn = document.getElementById('load-from-drive');
    if (loadFromDriveBtn) {
      loadFromDriveBtn.addEventListener('click', () => this.loadFromCloud());
    }
    
    const forceSyncBtn = document.getElementById('force-sync');
    if (forceSyncBtn) {
      forceSyncBtn.addEventListener('click', () => this.forceSync());
    }
    
    // Order modal
    const closeOrderBtn = document.getElementById('close-order');
    if (closeOrderBtn) {
      closeOrderBtn.addEventListener('click', () => this.closeOrderModal());
    }
    
    const sendWhatsAppBtn = document.getElementById('send-whatsapp');
    if (sendWhatsAppBtn) {
      sendWhatsAppBtn.addEventListener('click', () => this.sendWhatsAppOrder());
    }
    
    // Close modals on outside click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
      }
    });
    
    console.log('Event listeners setup completed');
  }

  handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
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

  handleRegister(e) {
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
    this.saveLocalUsers();
    
    // Auto-sync if connected
    if (this.driveSync.isAuthenticated) {
      this.driveSync.syncToCloud(this.users);
    }
    
    const modal = document.getElementById('register-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    
    // Clear form
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
    document.getElementById('reg-confirm').value = '';
    
    this.showNotification('Account created successfully! Please login.', 'success');
  }

  showStoreContent() {
    console.log('Showing store content');
    
    const loginSection = document.getElementById('login-section');
    const storeContent = document.getElementById('store-content');
    
    if (loginSection) {
      loginSection.classList.add('hidden');
    }
    if (storeContent) {
      storeContent.classList.remove('hidden');
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
        await this.syncUserData();
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
        <div class="diamond-count">${pack.diamonds} 💎</div>
        <div class="package-price">₹ ${pack.price.toLocaleString()}</div>
      </div>
      <button class="package-btn">Buy Now</button>
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
    
    const packageElement = document.getElementById('order-package');
    const priceElement = document.getElementById('order-price');
    const modal = document.getElementById('order-modal');
    
    if (packageElement) packageElement.textContent = packageName;
    if (priceElement) priceElement.textContent = price;
    if (modal) modal.classList.remove('hidden');
  }

  closeOrderModal() {
    const modal = document.getElementById('order-modal');
    const gameIdField = document.getElementById('game-id');
    const gameZoneField = document.getElementById('game-zone');
    
    if (modal) modal.classList.add('hidden');
    if (gameIdField) gameIdField.value = '';
    if (gameZoneField) gameZoneField.value = '';
    
    this.currentOrder = null;
  }

  sendWhatsAppOrder() {
    const gameIdField = document.getElementById('game-id');
    const gameZoneField = document.getElementById('game-zone');
    
    if (!gameIdField || !gameZoneField) {
      this.showNotification('Form fields not found', 'error');
      return;
    }
    
    const gameId = gameIdField.value.trim();
    const gameZone = gameZoneField.value.trim();
    
    if (!gameId || !gameZone) {
      this.showNotification('Please enter your Game ID and Zone ID', 'error');
      return;
    }
    
    const message = `🎮 P&K Store Order
    
👤 Customer: ${this.currentUser.username}
💎 Package: ${this.currentOrder.packageName}
💰 Price: ${this.currentOrder.price}
🎯 Game ID: ${gameId}
🌍 Zone ID: ${gameZone}
💳 UPI ID: ${CONFIG.UPI_ID}

Please confirm payment and process the order. Thank you!`;
    
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    this.closeOrderModal();
    this.showNotification('Order sent via WhatsApp!', 'success');
  }

  // Admin Functions
  showAdminPanel() {
    if (this.currentUser.role !== 'admin') {
      this.showNotification('Access denied', 'error');
      return;
    }
    
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
      this.renderAdminUsers();
    }
  }

  hideAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.add('hidden');
    }
  }

  handleAddUser() {
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
    this.saveLocalUsers();
    
    // Auto-sync if connected
    if (this.driveSync.isAuthenticated) {
      this.driveSync.syncToCloud(this.users);
    }
    
    // Clear form
    usernameField.value = '';
    passwordField.value = '';
    roleField.value = '';
    
    this.renderAdminUsers();
    this.showNotification(`User "${username}" added successfully`, 'success');
  }

  deleteUser(username) {
    if (username === this.currentUser.username) {
      this.showNotification('Cannot delete your own account', 'error');
      return;
    }
    
    this.users = this.users.filter(u => u.username !== username);
    this.saveLocalUsers();
    
    // Auto-sync if connected
    if (this.driveSync.isAuthenticated) {
      this.driveSync.syncToCloud(this.users);
    }
    
    this.renderAdminUsers();
    this.showNotification(`User "${username}" deleted`, 'info');
  }

  renderAdminUsers() {
    const container = document.getElementById('admin-users-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    this.users.forEach(user => {
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
  }

  async syncToCloud() {
    if (!this.driveSync.isAuthenticated) {
      this.showNotification('Please connect to Google Drive first', 'error');
      return;
    }
    
    this.updateAdminSyncProgress('Syncing to cloud...', 0);
    
    setTimeout(async () => {
      this.updateAdminSyncProgress('Uploading data...', 50);
      
      const success = await this.driveSync.syncToCloud(this.users);
      
      if (success) {
        this.updateAdminSyncProgress('Sync completed!', 100);
        this.showNotification('Data synced to Google Drive successfully!', 'success');
      } else {
        this.updateAdminSyncProgress('Sync failed', 0);
        this.showNotification('Failed to sync to Google Drive', 'error');
      }
      
      setTimeout(() => {
        this.updateAdminSyncProgress('Ready', 0);
      }, 2000);
    }, 500);
  }

  async loadFromCloud() {
    if (!this.driveSync.isAuthenticated) {
      this.showNotification('Please connect to Google Drive first', 'error');
      return;
    }
    
    this.updateAdminSyncProgress('Loading from cloud...', 0);
    
    setTimeout(async () => {
      this.updateAdminSyncProgress('Downloading data...', 50);
      
      const cloudData = await this.driveSync.syncFromCloud();
      
      if (cloudData) {
        this.users = cloudData;
        this.saveLocalUsers();
        this.renderAdminUsers();
        this.updateAdminSyncProgress('Load completed!', 100);
        this.showNotification('Data loaded from Google Drive successfully!', 'success');
      } else {
        this.updateAdminSyncProgress('No cloud data found', 0);
        this.showNotification('No data found in Google Drive', 'info');
      }
      
      setTimeout(() => {
        this.updateAdminSyncProgress('Ready', 0);
      }, 2000);
    }, 500);
  }

  async forceSync() {
    if (!this.driveSync.isAuthenticated) {
      this.showNotification('Please connect to Google Drive first', 'error');
      return;
    }
    
    this.updateAdminSyncProgress('Force syncing...', 0);
    
    setTimeout(async () => {
      this.updateAdminSyncProgress('Syncing data...', 30);
      
      const success = await this.syncUserData();
      
      if (success) {
        this.renderAdminUsers();
        this.updateAdminSyncProgress('Force sync completed!', 100);
        this.showNotification('Force sync completed successfully!', 'success');
      } else {
        this.updateAdminSyncProgress('Force sync failed', 0);
        this.showNotification('Force sync failed', 'error');
      }
      
      setTimeout(() => {
        this.updateAdminSyncProgress('Ready', 0);
      }, 2000);
    }, 500);
  }

  updateAdminSyncProgress(text, progress) {
    const progressFill = document.getElementById('admin-sync-progress');
    const progressText = document.getElementById('admin-sync-text');
    
    if (progressFill) progressFill.style.width = progress + '%';
    if (progressText) progressText.textContent = text;
  }

  // Utility Functions
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

// Utility Functions (Global)
function copyUpiId() {
  navigator.clipboard.writeText(CONFIG.UPI_ID).then(() => {
    if (window.app) {
      window.app.showNotification('UPI ID copied to clipboard!', 'success');
    }
  }).catch(() => {
    if (window.app) {
      window.app.showNotification('Failed to copy UPI ID', 'error');
    }
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
  window.copyUpiId = copyUpiId;
  
  console.log('App ready!');
});

// Auto-sync functionality
setInterval(async () => {
  if (app && app.driveSync.isAuthenticated && app.isLoggedIn) {
    // Perform background sync every 5 minutes
    console.log('Performing background sync...');
    await app.syncUserData();
  }
}, 300000); // 5 minutes

// Handle page visibility change for sync
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden && app && app.driveSync.isAuthenticated && app.isLoggedIn) {
    // Sync when page becomes visible
    console.log('Page visible, syncing...');
    await app.syncUserData();
  }
});