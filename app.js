// Application Configuration
const CONFIG = {
  GOOGLE_CLIENT_ID: '856647789843-teunsdqh8coqkicbq1rhgnesqpr5stkl.apps.googleusercontent.com',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  SCOPES: 'https://www.googleapis.com/auth/drive.file',
  USER_DATA_FILENAME: 'pk-store-users.json',
  ORDER_DATA_FILENAME: 'pk-store-orders.json',
  WHATSAPP_NUMBER: '9362584929',
  UPI_ID: 'BHARATPE.8R0E0I8U2N09755@fbpe'
};

// Diamond Packages Data
const DIAMOND_PACKAGES = {
  doubleBonusPacks: [
    { diamonds: "50+50", price: 80 },
    { diamonds: "150+150", price: 260 },
    { diamonds: "250+250", price: 370 },
    { diamonds: "500+500", price: 680, recommended: true }
  ],
  weeklyPass: { name: "Weekly Pass", price: 130, maxQuantity: 10 },
  smallPacks: [
    { diamonds: 11, price: 25 },
    { diamonds: 14, price: 30 },
    { diamonds: 22, price: 40 },
    { diamonds: 56, price: 85 }
  ],
  mediumPacks: [
    { diamonds: 86, price: 115 },
    { diamonds: 172, price: 230 },
    { diamonds: 257, price: 325 },
    { diamonds: 343, price: 430 },
    { diamonds: 429, price: 540 },
    { diamonds: 514, price: 650 },
    { diamonds: 600, price: 750 },
    { diamonds: 706, price: 860 }
  ],
  largerPacks: [
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

// Order Statuses
const ORDER_STATUSES = {
  processing: { color: "#ff9800", icon: "⏳", label: "Processing" },
  pending: { color: "#ffeb3b", icon: "⏸️", label: "Pending" },
  completed: { color: "#4caf50", icon: "✅", label: "Completed" },
  cancelled: { color: "#f44336", icon: "❌", label: "Cancelled" }
};

// Google Drive Sync Class
class DriveSync {
  constructor() {
    this.CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID;
    this.DISCOVERY_DOCS = CONFIG.DISCOVERY_DOCS;
    this.SCOPES = CONFIG.SCOPES;
    this.isInitialized = false;
    this.isAuthenticated = false;
    this.userFileId = null;
    this.orderFileId = null;
  }

  async initialize() {
    try {
      if (typeof gapi === 'undefined') {
        console.log('Google API not loaded, sync disabled');
        this.updateSyncStatus('disconnected');
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
      this.updateSyncStatus(this.isAuthenticated ? 'connected' : 'disconnected');
      return true;
    } catch (error) {
      console.error('Drive sync initialization failed:', error);
      this.updateSyncStatus('disconnected');
      return false;
    }
  }

  async authenticate() {
    if (!this.isInitialized) return false;
    
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
      this.updateSyncStatus('disconnected');
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

  async findFile(filename) {
    try {
      const response = await gapi.client.drive.files.list({
        q: `name='${filename}' and trashed=false`,
        spaces: 'drive'
      });
      
      if (response.result.files.length > 0) {
        return response.result.files[0].id;
      }
      return null;
    } catch (error) {
      console.error('Error finding file:', error);
      return null;
    }
  }

  async createFile(filename, data) {
    const fileMetadata = { name: filename };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
    form.append('file', new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}` }),
      body: form
    });

    const result = await response.json();
    return result.id;
  }

  async updateFile(fileId, data) {
    const form = new FormData();
    form.append('file', new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));

    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: new Headers({ 'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}` }),
      body: form
    });

    return await response.json();
  }

  async syncData(filename, data) {
    if (!this.isAuthenticated) return false;
    
    try {
      this.updateSyncStatus('syncing');
      
      let fileId = await this.findFile(filename);
      
      if (fileId) {
        await this.updateFile(fileId, data);
      } else {
        fileId = await this.createFile(filename, data);
      }
      
      if (filename === CONFIG.USER_DATA_FILENAME) {
        this.userFileId = fileId;
      } else if (filename === CONFIG.ORDER_DATA_FILENAME) {
        this.orderFileId = fileId;
      }
      
      this.updateSyncStatus('synced');
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateSyncStatus('disconnected');
      return false;
    }
  }

  async loadData(filename) {
    if (!this.isAuthenticated) return null;
    
    try {
      this.updateSyncStatus('syncing');
      
      const fileId = await this.findFile(filename);
      if (!fileId) return null;
      
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      
      this.updateSyncStatus('synced');
      return JSON.parse(response.body);
    } catch (error) {
      console.error('Failed to load from cloud:', error);
      this.updateSyncStatus('disconnected');
      return null;
    }
  }

  updateSyncStatus(status = 'disconnected') {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) return;
    
    const statusMap = {
      'connected': { text: 'Drive Connected', class: 'status--success' },
      'synced': { text: 'Data Synced', class: 'status--success' },
      'syncing': { text: 'Syncing...', class: 'status--warning' },
      'error': { text: 'Sync Error', class: 'status--error' },
      'disconnected': { text: 'Local Only', class: 'status--info' }
    };
    
    const statusInfo = statusMap[status] || statusMap['disconnected'];
    statusElement.textContent = statusInfo.text;
    statusElement.className = `status ${statusInfo.class}`;
  }
}

// Main Application Class
class PKStoreApp {
  constructor() {
    this.driveSync = new DriveSync();
    this.currentUser = null;
    this.users = [];
    this.orders = [];
    this.isLoggedIn = false;
    this.currentView = 'packages';
    this.currentOrder = null;
  }

  async initialize() {
    console.log('Initializing P&K Store App...');
    
    // Load data from localStorage first
    this.loadLocalData();
    
    // Initialize Google Drive API (non-blocking)
    this.driveSync.initialize().then(() => {
      console.log('Drive sync initialized');
    });
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Render diamond packages
    this.renderDiamondPackages();
    
    // Check login state
    this.checkLoginState();
    
    console.log('App initialization complete');
  }

  loadLocalData() {
    try {
      // Load users
      const storedUsers = localStorage.getItem('pk-store-users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        this.users = [...DEFAULT_USERS];
        this.saveLocalUsers();
      }

      // Load orders
      const storedOrders = localStorage.getItem('pk-store-orders');
      if (storedOrders) {
        this.orders = JSON.parse(storedOrders);
      } else {
        this.orders = [];
        this.saveLocalOrders();
      }
    } catch (error) {
      console.error('Error loading local data:', error);
      this.users = [...DEFAULT_USERS];
      this.orders = [];
      this.saveLocalUsers();
      this.saveLocalOrders();
    }
  }

  saveLocalUsers() {
    try {
      localStorage.setItem('pk-store-users', JSON.stringify(this.users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  saveLocalOrders() {
    try {
      localStorage.setItem('pk-store-orders', JSON.stringify(this.orders));
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Navigation
    const navOrdersBtn = document.getElementById('nav-my-orders-btn');
    if (navOrdersBtn) {
      navOrdersBtn.addEventListener('click', () => {
        if (this.currentView === 'orders') {
          this.showPackages();
          navOrdersBtn.textContent = 'My Orders';
        } else {
          this.showMyOrders();
          navOrdersBtn.textContent = 'Back to Store';
        }
      });
    }

    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if (adminPanelBtn) {
      adminPanelBtn.addEventListener('click', () => this.showAdminPanel());
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    const closeAdminBtn = document.getElementById('close-admin-btn');
    if (closeAdminBtn) {
      closeAdminBtn.addEventListener('click', () => this.hideAdminPanel());
    }

    // Google Drive connection
    const connectDriveBtn = document.getElementById('connect-drive-btn');
    if (connectDriveBtn) {
      connectDriveBtn.addEventListener('click', () => this.toggleDriveConnection());
    }

    // Order modal
    const closeOrderBtn = document.getElementById('close-order-btn');
    if (closeOrderBtn) {
      closeOrderBtn.addEventListener('click', () => this.closeOrderModal());
    }

    const copyUpiBtn = document.getElementById('copy-upi-btn');
    if (copyUpiBtn) {
      copyUpiBtn.addEventListener('click', () => this.copyUpiId());
    }

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
      orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitOrder();
      });
    }

    // Admin functions
    const orderSearch = document.getElementById('order-search');
    if (orderSearch) {
      orderSearch.addEventListener('input', (e) => this.searchOrders(e.target.value));
    }

    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportOrdersCSV());
    }

    // Close modals on outside click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
      }
    });
  }

  handleLogin() {
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');

    if (!usernameField || !passwordField) {
      this.showNotification('Login form error', 'error');
      return;
    }

    const username = usernameField.value.trim();
    const password = passwordField.value;
    
    if (!username || !password) {
      this.showNotification('Please enter both username and password', 'error');
      return;
    }
    
    const user = this.users.find(u => u.username === username && u.password === password);
    
    if (user) {
      this.currentUser = user;
      this.isLoggedIn = true;
      localStorage.setItem('pk-store-current-user', JSON.stringify(user));
      
      this.showStoreContent();
      this.showNotification(`Welcome back, ${user.username}!`, 'success');
    } else {
      this.showNotification('Invalid username or password', 'error');
    }
  }

  showStoreContent() {
    const authSection = document.getElementById('auth-section');
    const storeSection = document.getElementById('store-section');

    if (authSection) authSection.classList.add('hidden');
    if (storeSection) storeSection.classList.remove('hidden');
    
    // Update user info
    const currentUserSpan = document.getElementById('current-user');
    const userRoleSpan = document.getElementById('user-role');

    if (currentUserSpan) currentUserSpan.textContent = this.currentUser.username;
    if (userRoleSpan) userRoleSpan.textContent = this.currentUser.role.toUpperCase();
    
    // Show admin panel button if admin
    if (this.currentUser.role === 'admin') {
      const adminPanelBtn = document.getElementById('admin-panel-btn');
      if (adminPanelBtn) adminPanelBtn.classList.remove('hidden');
    }

    this.showPackages();
  }

  logout() {
    this.currentUser = null;
    this.isLoggedIn = false;
    localStorage.removeItem('pk-store-current-user');
    
    const authSection = document.getElementById('auth-section');
    const storeSection = document.getElementById('store-section');
    const adminPanel = document.getElementById('admin-panel');

    if (authSection) authSection.classList.remove('hidden');
    if (storeSection) storeSection.classList.add('hidden');
    if (adminPanel) adminPanel.classList.add('hidden');
    
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
        if (this.users.find(u => u.username === user.username)) {
          this.currentUser = user;
          this.isLoggedIn = true;
          this.showStoreContent();
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
        const connectBtn = document.getElementById('connect-drive-btn');
        if (connectBtn) connectBtn.textContent = 'Disconnect Drive';
        this.showNotification('Connected to Google Drive!', 'success');
        await this.syncAllData();
      } else {
        this.showNotification('Failed to connect to Google Drive', 'error');
      }
    } else {
      await this.driveSync.signOut();
      const connectBtn = document.getElementById('connect-drive-btn');
      if (connectBtn) connectBtn.textContent = 'Connect Drive';
      this.showNotification('Disconnected from Google Drive', 'info');
    }
  }

  async syncAllData() {
    if (this.driveSync.isAuthenticated) {
      await this.driveSync.syncData(CONFIG.USER_DATA_FILENAME, this.users);
      await this.driveSync.syncData(CONFIG.ORDER_DATA_FILENAME, this.orders);
    }
  }

  renderDiamondPackages() {
    // Render small packs
    const smallContainer = document.getElementById('small-packs');
    if (smallContainer) {
      smallContainer.innerHTML = '';
      DIAMOND_PACKAGES.smallPacks.forEach(pack => {
        smallContainer.appendChild(this.createPackageCard(pack.diamonds, pack.price));
      });
    }

    // Render medium packs
    const mediumContainer = document.getElementById('medium-packs');
    if (mediumContainer) {
      mediumContainer.innerHTML = '';
      DIAMOND_PACKAGES.mediumPacks.forEach(pack => {
        mediumContainer.appendChild(this.createPackageCard(pack.diamonds, pack.price));
      });
    }

    // Render larger packs
    const largerContainer = document.getElementById('larger-packs');
    if (largerContainer) {
      largerContainer.innerHTML = '';
      DIAMOND_PACKAGES.largerPacks.forEach(pack => {
        largerContainer.appendChild(this.createPackageCard(pack.diamonds, pack.price));
      });
    }
  }

  createPackageCard(diamonds, price) {
    const card = document.createElement('div');
    card.className = 'package-card';
    
    card.innerHTML = `
      <div class="package-header">
        <div class="diamond-count">${diamonds} 💎</div>
        <div class="package-price">₹ ${price.toLocaleString()}</div>
      </div>
      <button class="order-btn">Order Now</button>
    `;
    
    const button = card.querySelector('.order-btn');
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Order button clicked for:', diamonds, price);
        this.showOrderModal(`${diamonds} 💎`, price);
      });
    }
    
    return card;
  }

  showOrderModal(packageName, price) {
    console.log('showOrderModal called with:', packageName, price);
    
    if (!this.isLoggedIn) {
      this.showNotification('Please login first', 'error');
      return;
    }
    
    this.currentOrder = { packageName, price };
    
    const packageElement = document.getElementById('order-package');
    const priceElement = document.getElementById('order-price');
    const modal = document.getElementById('order-modal');
    
    if (packageElement) packageElement.textContent = packageName;
    if (priceElement) priceElement.textContent = `₹ ${price.toLocaleString()}`;
    if (modal) {
      console.log('Opening modal...');
      modal.classList.remove('hidden');
    } else {
      console.error('Modal element not found');
    }
  }

  closeOrderModal() {
    const modal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    
    if (modal) modal.classList.add('hidden');
    if (orderForm) orderForm.reset();
    
    this.currentOrder = null;
  }

  copyUpiId() {
    navigator.clipboard.writeText(CONFIG.UPI_ID).then(() => {
      this.showNotification('UPI ID copied to clipboard!', 'success');
    }).catch(() => {
      this.showNotification('Failed to copy UPI ID', 'error');
    });
  }

  generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `PK${timestamp}${random}`.toUpperCase();
  }

  async submitOrder() {
    if (!this.currentOrder) {
      this.showNotification('No order selected', 'error');
      return;
    }

    const mlbbIdField = document.getElementById('mlbb-id');
    const serverIdField = document.getElementById('server-id');
    const ignField = document.getElementById('ign');
    const paymentSsField = document.getElementById('payment-ss');

    if (!mlbbIdField || !serverIdField || !ignField || !paymentSsField) {
      this.showNotification('Form fields not found', 'error');
      return;
    }

    const mlbbId = mlbbIdField.value.trim();
    const serverId = serverIdField.value.trim();
    const ign = ignField.value.trim();
    const paymentScreenshot = paymentSsField.files[0];
    
    if (!mlbbId || !serverId || !ign || !paymentScreenshot) {
      this.showNotification('Please fill in all fields and upload payment screenshot', 'error');
      return;
    }

    const orderId = this.generateOrderId();
    const order = {
      id: orderId,
      userId: this.currentUser.username,
      username: this.currentUser.username,
      product: this.currentOrder.packageName,
      price: this.currentOrder.price,
      mlbbId: mlbbId,
      serverId: serverId,
      ign: ign,
      paymentScreenshot: paymentScreenshot.name,
      status: 'processing',
      timestamp: Date.now(),
      adminNotes: ''
    };

    this.orders.push(order);
    this.saveLocalOrders();

    // Sync to cloud if connected
    if (this.driveSync.isAuthenticated) {
      await this.driveSync.syncData(CONFIG.ORDER_DATA_FILENAME, this.orders);
    }

    // Send WhatsApp message
    this.sendWhatsAppOrder(order);
    
    this.closeOrderModal();
    this.showNotification(`Order ${orderId} created successfully!`, 'success');
  }

  sendWhatsAppOrder(order) {
    const message = `🎮 P&K Store Order

📋 Order ID: ${order.id}
👤 Customer: ${order.username}
💎 Package: ${order.product}
💰 Price: ₹ ${order.price.toLocaleString()}
🎯 MLBB ID: ${order.mlbbId}
🌍 Server ID: ${order.serverId}
🎮 IGN: ${order.ign}
💳 UPI ID: ${CONFIG.UPI_ID}
📸 Payment Screenshot: ${order.paymentScreenshot}

Status: Processing ⏳

Please confirm payment and process the order. Thank you!`;
    
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  showPackages() {
    this.currentView = 'packages';
    const packagesSection = document.getElementById('packages-section');
    const ordersSection = document.getElementById('my-orders-section');
    
    if (packagesSection) packagesSection.classList.remove('hidden');
    if (ordersSection) ordersSection.classList.add('hidden');
  }

  showMyOrders() {
    this.currentView = 'orders';
    const packagesSection = document.getElementById('packages-section');
    const ordersSection = document.getElementById('my-orders-section');
    
    if (packagesSection) packagesSection.classList.add('hidden');
    if (ordersSection) ordersSection.classList.remove('hidden');
    
    this.renderMyOrders();
  }

  renderMyOrders() {
    const tbody = document.querySelector('#my-orders-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const userOrders = this.orders.filter(order => order.userId === this.currentUser.username);
    
    if (userOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders found</td></tr>';
      return;
    }

    userOrders.sort((a, b) => b.timestamp - a.timestamp).forEach(order => {
      const tr = document.createElement('tr');
      const statusClass = `status-${order.status}`;
      
      tr.innerHTML = `
        <td><strong>${order.id}</strong></td>
        <td>${order.product}</td>
        <td>₹ ${order.price.toLocaleString()}</td>
        <td><span class="status ${statusClass}">${ORDER_STATUSES[order.status]?.icon} ${ORDER_STATUSES[order.status]?.label}</span></td>
        <td>${new Date(order.timestamp).toLocaleDateString()}</td>
      `;
      
      tbody.appendChild(tr);
    });
  }

  showAdminPanel() {
    if (this.currentUser.role !== 'admin') {
      this.showNotification('Access denied', 'error');
      return;
    }
    
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
      this.renderAdminOrders();
    }
  }

  hideAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) adminPanel.classList.add('hidden');
  }

  renderAdminOrders(searchTerm = '') {
    const tbody = document.querySelector('#admin-orders-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    let filteredOrders = this.orders;
    if (searchTerm) {
      filteredOrders = this.orders.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filteredOrders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No orders found</td></tr>';
      return;
    }

    filteredOrders.sort((a, b) => b.timestamp - a.timestamp).forEach(order => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td><strong>${order.id}</strong></td>
        <td>${order.username}</td>
        <td>${order.product}</td>
        <td>₹ ${order.price.toLocaleString()}</td>
        <td>
          <select class="status-select" data-order-id="${order.id}">
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <input class="notes-input" data-order-id="${order.id}" value="${order.adminNotes || ''}" placeholder="Add notes...">
        </td>
        <td>
          <button class="update-btn" data-order-id="${order.id}">Update</button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });

    // Add event listeners for update buttons
    document.querySelectorAll('.update-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.updateOrder(e.target.dataset.orderId));
    });
  }

  async updateOrder(orderId) {
    const statusSelect = document.querySelector(`select[data-order-id="${orderId}"]`);
    const notesInput = document.querySelector(`input[data-order-id="${orderId}"]`);
    
    if (!statusSelect || !notesInput) {
      this.showNotification('Update form not found', 'error');
      return;
    }

    const newStatus = statusSelect.value;
    const newNotes = notesInput.value;
    
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
      this.orders[orderIndex].status = newStatus;
      this.orders[orderIndex].adminNotes = newNotes;
      this.orders[orderIndex].lastModified = Date.now();
      
      this.saveLocalOrders();
      
      // Sync to cloud if connected
      if (this.driveSync.isAuthenticated) {
        await this.driveSync.syncData(CONFIG.ORDER_DATA_FILENAME, this.orders);
      }
      
      this.showNotification(`Order ${orderId} updated successfully`, 'success');
    }
  }

  searchOrders(searchTerm) {
    this.renderAdminOrders(searchTerm);
  }

  exportOrdersCSV() {
    if (this.orders.length === 0) {
      this.showNotification('No orders to export', 'info');
      return;
    }

    const headers = ['Order ID', 'Username', 'Product', 'Price', 'MLBB ID', 'Server ID', 'IGN', 'Status', 'Date', 'Admin Notes'];
    const csvContent = [
      headers.join(','),
      ...this.orders.map(order => [
        order.id,
        order.username,
        `"${order.product}"`,
        order.price,
        order.mlbbId,
        order.serverId,
        `"${order.ign}"`,
        order.status,
        new Date(order.timestamp).toISOString().split('T')[0],
        `"${order.adminNotes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pk-store-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.showNotification('Orders exported successfully', 'success');
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
  
  // Make app globally available
  window.app = app;
  
  console.log('App ready!');
});

// Auto-sync functionality
setInterval(async () => {
  if (app && app.driveSync.isAuthenticated && app.isLoggedIn) {
    console.log('Performing background sync...');
    await app.syncAllData();
  }
}, 300000); // 5 minutes

// Handle page visibility change for sync
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden && app && app.driveSync.isAuthenticated && app.isLoggedIn) {
    console.log('Page visible, syncing...');
    await app.syncAllData();
  }
});