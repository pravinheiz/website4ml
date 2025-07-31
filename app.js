// Main Application Module
const app = (function() {
  // DOM Elements
  const elements = {
    loginSection: document.getElementById('login-section'),
    storeContent: document.getElementById('store-content'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    logoutBtn: document.getElementById('logout-btn'),
    adminPanelBtn: document.getElementById('admin-panel-btn'),
    adminPanel: document.getElementById('admin-panel'),
    closeAdmin: document.getElementById('close-admin'),
    currentUser: document.getElementById('current-user'),
    userRole: document.getElementById('user-role'),
    smallPacks: document.getElementById('small-packs'),
    mediumPacks: document.getElementById('medium-packs'),
    largerPacks: document.getElementById('larger-packs'),
    orderModal: document.getElementById('order-modal'),
    closeOrder: document.getElementById('close-order'),
    orderForm: document.getElementById('order-form'),
    orderPackage: document.getElementById('order-package'),
    orderPrice: document.getElementById('order-price'),
    registerModal: document.getElementById('register-modal'),
    showRegister: document.getElementById('show-register'),
    closeRegister: document.getElementById('close-register'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notification-text'),
    loadingOverlay: document.getElementById('loading-overlay'),
    sessionWarning: document.getElementById('session-warning'),
    sessionCountdown: document.getElementById('session-countdown'),
    extendSession: document.getElementById('extend-session'),
    testLogin: document.getElementById('test-login'),
    syncStatus: document.getElementById('sync-status'),
    connectDriveBtn: document.getElementById('connect-drive-btn'),
    syncToDrive: document.getElementById('sync-to-drive'),
    loadFromDrive: document.getElementById('load-from-drive'),
    forceSync: document.getElementById('force-sync'),
    adminSyncProgress: document.getElementById('admin-sync-progress'),
    adminSyncText: document.getElementById('admin-sync-text'),
    adminUsersList: document.getElementById('admin-users-list'),
    adminOrdersList: document.getElementById('admin-orders-list'),
    addUserBtn: document.getElementById('add-user-btn'),
    adminUsername: document.getElementById('admin-username'),
    adminPassword: document.getElementById('admin-password'),
    adminRole: document.getElementById('admin-role'),
    passwordStrength: document.getElementById('password-strength'),
    passwordStrengthBar: document.querySelector('.password-strength-bar'),
    upiId: document.querySelector('.upi-id'),
    mlbbId: document.getElementById('mlbb-id'),
    serverId: document.getElementById('server-id'),
    ign: document.getElementById('ign')
  };

  // App State
  let state = {
    currentUser: null,
    packages: [],
    users: [],
    orders: [],
    sessionTimeout: null,
    sessionTimer: null,
    googleAuth: null,
    isDriveConnected: false,
    driveFileId: null
  };

  // Initialize the app
  function init() {
    loadInitialData();
    setupEventListeners();
    checkAuthState();
  }

  // Load initial data from localStorage
  function loadInitialData() {
    // Load users
    const storedUsers = localStorage.getItem('mlbb_users');
    if (storedUsers) {
      state.users = JSON.parse(storedUsers);
    } else {
      // Default admin user
      state.users = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'vip', password: 'vip123', role: 'vip' },
        { username: 'customer', password: 'customer123', role: 'customer' }
      ];
      saveUsers();
    }

    // Load packages
    const storedPackages = localStorage.getItem('mlbb_packages');
    if (storedPackages) {
      state.packages = JSON.parse(storedPackages);
    } else {
      // Default diamond packages
      state.packages = [
        { id: 1, diamonds: 50, price: 100, bonus: 'No bonus', category: 'small' },
        { id: 2, diamonds: 100, price: 200, bonus: 'No bonus', category: 'small' },
        { id: 3, diamonds: 170, price: 300, bonus: 'No bonus', category: 'small' },
        { id: 4, diamonds: 250, price: 400, bonus: 'No bonus', category: 'medium' },
        { id: 5, diamonds: 400, price: 600, bonus: 'No bonus', category: 'medium' },
        { id: 6, diamonds: 500, price: 800, bonus: 'No bonus', category: 'medium' },
        { id: 7, diamonds: 1000, price: 1500, bonus: '100 bonus diamonds', category: 'large' },
        { id: 8, diamonds: 2000, price: 3000, bonus: '200 bonus diamonds', category: 'large' },
        { id: 9, diamonds: 4000, price: 6000, bonus: '500 bonus diamonds', category: 'large' }
      ];
      savePackages();
    }

    // Load orders
    const storedOrders = localStorage.getItem('mlbb_orders');
    if (storedOrders) {
      state.orders = JSON.parse(storedOrders);
    } else {
      state.orders = [];
      saveOrders();
    }

    // Load settings
    const storedSettings = localStorage.getItem('mlbb_settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      state.driveFileId = settings.driveFileId;
      state.isDriveConnected = settings.isDriveConnected;
    }

    // Update UI based on loaded data
    renderPackages();
    updateSyncStatus();
  }

  // Save data to localStorage
  function saveUsers() {
    localStorage.setItem('mlbb_users', JSON.stringify(state.users));
  }

  function savePackages() {
    localStorage.setItem('mlbb_packages', JSON.stringify(state.packages));
  }

  function saveOrders() {
    localStorage.setItem('mlbb_orders', JSON.stringify(state.orders));
  }

  function saveSettings() {
    const settings = {
      driveFileId: state.driveFileId,
      isDriveConnected: state.isDriveConnected
    };
    localStorage.setItem('mlbb_settings', JSON.stringify(settings));
  }

  // Setup event listeners
  function setupEventListeners() {
    // Login/Logout
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    elements.testLogin.addEventListener('click', testAdminLogin);

    // Registration
    elements.showRegister.addEventListener('click', showRegisterModal);
    elements.closeRegister.addEventListener('click', hideRegisterModal);
    elements.registerForm.addEventListener('submit', handleRegister);

    // Packages and Orders
    elements.closeOrder.addEventListener('click', hideOrderModal);
    elements.orderForm.addEventListener('submit', handleOrderSubmit);

    // Admin Panel
    elements.adminPanelBtn.addEventListener('click', showAdminPanel);
    elements.closeAdmin.addEventListener('click', hideAdminPanel);
    elements.addUserBtn.addEventListener('click', handleAddUser);

    // Session management
    elements.extendSession.addEventListener('click', extendSession);

    // Google Drive Sync
    elements.connectDriveBtn.addEventListener('click', initGoogleDrive);
    elements.syncToDrive.addEventListener('click', syncToDrive);
    elements.loadFromDrive.addEventListener('click', loadFromDrive);
    elements.forceSync.addEventListener('click', forceSync);

    // Admin tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchAdminTab(btn.dataset.tab));
    });

    // Order filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => filterOrders(btn.dataset.filter));
    });
  }

  // Authentication functions
  function checkAuthState() {
    const loggedInUser = localStorage.getItem('mlbb_currentUser');
    if (loggedInUser) {
      state.currentUser = JSON.parse(loggedInUser);
      showStoreContent();
      startSessionTimer();
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const username = elements.username.value.trim();
    const password = elements.password.value.trim();

    const user = state.users.find(u => u.username === username && u.password === password);
    if (user) {
      state.currentUser = user;
      localStorage.setItem('mlbb_currentUser', JSON.stringify(user));
      showStoreContent();
      showNotification('Login successful!', 'success');
      startSessionTimer();
    } else {
      showNotification('Invalid username or password', 'error');
    }
  }

  function testAdminLogin() {
    elements.username.value = 'admin';
    elements.password.value = 'admin123';
    elements.loginForm.dispatchEvent(new Event('submit'));
  }

  function handleLogout() {
    state.currentUser = null;
    localStorage.removeItem('mlbb_currentUser');
    hideStoreContent();
    clearSessionTimer();
    showNotification('Logged out successfully', 'success');
  }

  function handleRegister(e) {
    e.preventDefault();
    const username = elements.regUsername.value.trim();
    const password = elements.regPassword.value.trim();
    const confirm = elements.regConfirm.value.trim();

    if (password !== confirm) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    if (state.users.some(u => u.username === username)) {
      showNotification('Username already exists', 'error');
      return;
    }

    const newUser = {
      username,
      password,
      role: 'customer'
    };

    state.users.push(newUser);
    saveUsers();
    hideRegisterModal();
    showNotification('Account created successfully! Please login', 'success');
  }

  // Session management
  function startSessionTimer() {
    clearSessionTimer();
    let timeLeft = 300; // 5 minutes in seconds

    // Update countdown display
    elements.sessionCountdown.textContent = formatTime(timeLeft);
    
    // Update every second
    state.sessionTimer = setInterval(() => {
      timeLeft--;
      elements.sessionCountdown.textContent = formatTime(timeLeft);

      // Show warning at 1 minute
      if (timeLeft === 60) {
        elements.sessionWarning.classList.remove('hidden');
      }

      // Logout when time is up
      if (timeLeft <= 0) {
        handleLogout();
        elements.sessionWarning.classList.add('hidden');
      }
    }, 1000);

    // Set timeout for session expiration
    state.sessionTimeout = setTimeout(() => {
      handleLogout();
      elements.sessionWarning.classList.add('hidden');
    }, timeLeft * 1000);
  }

  function extendSession() {
    startSessionTimer();
    elements.sessionWarning.classList.add('hidden');
    showNotification('Session extended', 'success');
  }

  function clearSessionTimer() {
    if (state.sessionTimer) clearInterval(state.sessionTimer);
    if (state.sessionTimeout) clearTimeout(state.sessionTimeout);
    elements.sessionWarning.classList.add('hidden');
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // UI Functions
  function showStoreContent() {
    elements.loginSection.classList.add('hidden');
    elements.storeContent.classList.remove('hidden');
    updateUserInfo();
    renderPackages();
  }

  function hideStoreContent() {
    elements.loginSection.classList.remove('hidden');
    elements.storeContent.classList.add('hidden');
    elements.loginForm.reset();
  }

  function updateUserInfo() {
    if (state.currentUser) {
      elements.currentUser.textContent = state.currentUser.username;
      elements.userRole.textContent = state.currentUser.role.toUpperCase();
      
      // Show admin panel button for admins
      if (state.currentUser.role === 'admin') {
        elements.adminPanelBtn.classList.remove('hidden');
      } else {
        elements.adminPanelBtn.classList.add('hidden');
      }
    }
  }

  function showRegisterModal() {
    elements.registerModal.classList.remove('hidden');
    elements.regUsername.focus();
  }

  function hideRegisterModal() {
    elements.registerModal.classList.add('hidden');
    elements.registerForm.reset();
    elements.passwordStrength.classList.remove('weak', 'medium', 'strong');
    elements.passwordStrengthBar.style.width = '0%';
  }

  function showOrderModal(packageId) {
    const pkg = state.packages.find(p => p.id === packageId);
    if (pkg) {
      elements.orderPackage.textContent = `${pkg.diamonds} Diamonds`;
      elements.orderPrice.textContent = `₹ ${pkg.price}`;
      elements.orderModal.dataset.packageId = packageId;
      elements.orderModal.classList.remove('hidden');
    }
  }

  function hideOrderModal() {
    elements.orderModal.classList.add('hidden');
    elements.orderForm.reset();
  }

  function showAdminPanel() {
    elements.adminPanel.classList.remove('hidden');
    renderAdminUsers();
    renderAdminOrders();
  }

  function hideAdminPanel() {
    elements.adminPanel.classList.add('hidden');
  }

  function switchAdminTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === `${tabName}-tab`);
    });
  }

  function filterOrders(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    // Re-render orders with filter
    renderAdminOrders(filter);
  }

  // Package functions
  function renderPackages() {
    // Clear existing packages
    elements.smallPacks.innerHTML = '';
    elements.mediumPacks.innerHTML = '';
    elements.largerPacks.innerHTML = '';

    // Group packages by category
    const smallPacks = state.packages.filter(p => p.category === 'small');
    const mediumPacks = state.packages.filter(p => p.category === 'medium');
    const largePacks = state.packages.filter(p => p.category === 'large');

    // Render each category
    renderPackageCategory(smallPacks, elements.smallPacks);
    renderPackageCategory(mediumPacks, elements.mediumPacks);
    renderPackageCategory(largePacks, elements.largerPacks);
  }

  function renderPackageCategory(packages, container) {
    packages.forEach(pkg => {
      const packageCard = document.createElement('div');
      packageCard.className = 'package-card';
      if (pkg.bonus && pkg.bonus !== 'No bonus') {
        packageCard.classList.add('special');
      }

      packageCard.innerHTML = `
        <div class="package-header">
          <div class="diamond-count">${pkg.diamonds} 💎</div>
          <div class="package-price">₹ ${pkg.price}</div>
        </div>
        <div class="package-bonus">
          <p class="bonus-text">${pkg.bonus}</p>
        </div>
        <button class="package-btn" data-id="${pkg.id}">Buy Now</button>
      `;

      container.appendChild(packageCard);
    });

    // Add event listeners to all package buttons
    container.querySelectorAll('.package-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const packageId = parseInt(e.target.dataset.id);
        showOrderModal(packageId);
      });
    });
  }

  // Order functions
  function handleOrderSubmit(e) {
    e.preventDefault();
    const packageId = parseInt(elements.orderModal.dataset.packageId);
    const pkg = state.packages.find(p => p.id === packageId);

    if (!pkg) {
      showNotification('Invalid package selected', 'error');
      return;
    }

    const newOrder = {
      id: Date.now(),
      packageId: pkg.id,
      diamonds: pkg.diamonds,
      price: pkg.price,
      mlbbId: elements.mlbbId.value.trim(),
      serverId: elements.serverId.value.trim(),
      ign: elements.ign.value.trim(),
      username: state.currentUser.username,
      status: 'pending',
      date: new Date().toISOString()
    };

    state.orders.push(newOrder);
    saveOrders();

    // Send WhatsApp message
    const whatsappUrl = `https://wa.me/919362584929?text=${encodeURIComponent(
      `New MLBB Diamond Order\n\n` +
      `Package: ${pkg.diamonds} Diamonds (₹${pkg.price})\n` +
      `IGN: ${newOrder.ign}\n` +
      `MLBB ID: ${newOrder.mlbbId}\n` +
      `Server ID: ${newOrder.serverId}\n` +
      `Order ID: ${newOrder.id}`
    )}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');

    hideOrderModal();
    showNotification('Order placed successfully!', 'success');

    // Update admin orders list if panel is open
    if (!elements.adminPanel.classList.contains('hidden')) {
      renderAdminOrders();
    }
  }

  // Admin functions
  function renderAdminUsers() {
    elements.adminUsersList.innerHTML = '';
    
    state.users.forEach(user => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      
      userItem.innerHTML = `
        <span>${user.username}</span>
        <span class="user-role-badge ${user.role}">${user.role.toUpperCase()}</span>
        <div class="user-actions">
          ${user.role !== 'admin' ? `<button class="btn btn--sm btn--outline" data-username="${user.username}">Delete</button>` : ''}
        </div>
      `;
      
      elements.adminUsersList.appendChild(userItem);
    });

    // Add event listeners to delete buttons
    elements.adminUsersList.querySelectorAll('.btn--outline').forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.dataset.username;
        deleteUser(username);
      });
    });
  }

  function handleAddUser() {
    const username = elements.adminUsername.value.trim();
    const password = elements.adminPassword.value.trim();
    const role = elements.adminRole.value;

    if (!username || !password) {
      showNotification('Username and password are required', 'error');
      return;
    }

    if (state.users.some(u => u.username === username)) {
      showNotification('Username already exists', 'error');
      return;
    }

    const newUser = {
      username,
      password,
      role
    };

    state.users.push(newUser);
    saveUsers();
    renderAdminUsers();
    showNotification('User added successfully', 'success');

    // Clear form
    elements.adminUsername.value = '';
    elements.adminPassword.value = '';
  }

  function deleteUser(username) {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      state.users = state.users.filter(u => u.username !== username);
      saveUsers();
      renderAdminUsers();
      showNotification('User deleted successfully', 'success');
    }
  }

  function renderAdminOrders(filter = 'all') {
    elements.adminOrdersList.innerHTML = '';
    
    let ordersToDisplay = [...state.orders];
    
    // Apply filter
    if (filter !== 'all') {
      ordersToDisplay = ordersToDisplay.filter(o => o.status === filter);
    }
    
    // Sort by date (newest first)
    ordersToDisplay.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (ordersToDisplay.length === 0) {
      elements.adminOrdersList.innerHTML = '<div class="no-orders">No orders found</div>';
      return;
    }
    
    ordersToDisplay.forEach(order => {
      const pkg = state.packages.find(p => p.id === order.packageId);
      const orderItem = document.createElement('div');
      orderItem.className = 'order-item';
      
      orderItem.innerHTML = `
        <div>
          <strong>Order #${order.id}</strong>
          <div>${pkg ? pkg.diamonds + ' Diamonds' : 'Unknown Package'}</div>
          <div>Customer: ${order.username}</div>
        </div>
        <div>
          <div>₹${order.price}</div>
          <div>${new Date(order.date).toLocaleString()}</div>
          <div class="order-status ${order.status}">${order.status.toUpperCase()}</div>
        </div>
        <div class="order-actions">
          <select class="status-select" data-order-id="${order.id}">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
          <button class="btn btn--sm btn--outline" data-order-id="${order.id}">Details</button>
        </div>
      `;
      
      elements.adminOrdersList.appendChild(orderItem);
    });
    
    // Add event listeners to status selects
    elements.adminOrdersList.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const orderId = parseInt(e.target.dataset.orderId);
        updateOrderStatus(orderId, e.target.value);
      });
    });
    
    // Add event listeners to detail buttons
    elements.adminOrdersList.querySelectorAll('.btn--outline').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = parseInt(btn.dataset.orderId);
        showOrderDetails(orderId);
      });
    });
  }

  function updateOrderStatus(orderId, newStatus) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      saveOrders();
      showNotification('Order status updated', 'success');
    }
  }

  function showOrderDetails(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const pkg = state.packages.find(p => p.id === order.packageId);
    
    alert(
      `Order Details\n\n` +
      `Order ID: ${order.id}\n` +
      `Package: ${pkg ? pkg.diamonds + ' Diamonds' : 'Unknown'}\n` +
      `Price: ₹${order.price}\n` +
      `Customer: ${order.username}\n` +
      `MLBB ID: ${order.mlbbId}\n` +
      `Server ID: ${order.serverId}\n` +
      `IGN: ${order.ign}\n` +
      `Status: ${order.status}\n` +
      `Date: ${new Date(order.date).toLocaleString()}`
    );
  }

  // Google Drive integration
  function initGoogleDrive() {
    showLoading('Connecting to Google Drive...');
    
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: 'YOUR_API_KEY',
        clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file'
      }).then(() => {
        state.googleAuth = gapi.auth2.getAuthInstance();
        
        // Listen for sign-in state changes
        state.googleAuth.isSignedIn.listen(updateDriveStatus);
        
        // Sign in if not already signed in
        if (!state.googleAuth.isSignedIn.get()) {
          state.googleAuth.signIn();
        } else {
          updateDriveStatus(true);
        }
      }).catch(err => {
        hideLoading();
        showNotification('Failed to initialize Google Drive: ' + err.message, 'error');
      });
    });
  }

  function updateDriveStatus(isSignedIn) {
    if (isSignedIn) {
      state.isDriveConnected = true;
      elements.syncStatus.textContent = '🟢 Connected to Drive';
      elements.syncStatus.classList.remove('disconnected');
      elements.syncStatus.classList.add('connected');
      showNotification('Successfully connected to Google Drive', 'success');
    } else {
      state.isDriveConnected = false;
      elements.syncStatus.textContent = '⚫ Local Only';
      elements.syncStatus.classList.remove('connected');
      elements.syncStatus.classList.add('disconnected');
    }
    saveSettings();
    hideLoading();
  }

  function syncToDrive() {
    if (!state.isDriveConnected) {
      showNotification('Please connect to Google Drive first', 'error');
      return;
    }

    showLoading('Syncing data to Google Drive...');
    updateSyncProgress(0, 'Preparing data...');

    // Prepare all data to sync
    const appData = {
      users: state.users,
      packages: state.packages,
      orders: state.orders,
      settings: {
        driveFileId: state.driveFileId,
        isDriveConnected: state.isDriveConnected
      }
    };

    updateSyncProgress(20, 'Uploading data...');

    const fileContent = JSON.stringify(appData);
    const blob = new Blob([fileContent], { type: 'application/json' });
    
    if (state.driveFileId) {
      // Update existing file
      updateSyncProgress(40, 'Updating existing file...');
      
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";
        
      const metadata = {
        'name': 'mlbb_store_data.json',
        'mimeType': 'application/json'
      };
        
      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;
        
      gapi.client.drive.files.update({
        fileId: state.driveFileId,
        uploadType: 'multipart',
        fields: 'id',
        media: {
          mimeType: 'application/json',
          body: multipartRequestBody
        }
      }).then(response => {
        updateSyncProgress(100, 'Sync complete!');
        showNotification('Data synced to Google Drive successfully', 'success');
        setTimeout(hideLoading, 1000);
      }).catch(err => {
        updateSyncProgress(0, 'Sync failed');
        showNotification('Failed to sync data: ' + err.message, 'error');
        hideLoading();
      });
    } else {
      // Create new file
      updateSyncProgress(40, 'Creating new file...');
      
      const fileMetadata = {
        'name': 'mlbb_store_data.json',
        'mimeType': 'application/json'
      };
      
      gapi.client.drive.files.create({
        resource: fileMetadata,
        media: {
          mimeType: 'application/json',
          body: fileContent
        },
        fields: 'id'
      }).then(response => {
        state.driveFileId = response.result.id;
        saveSettings();
        updateSyncProgress(100, 'Sync complete!');
        showNotification('Data synced to Google Drive successfully', 'success');
        setTimeout(hideLoading, 1000);
      }).catch(err => {
        updateSyncProgress(0, 'Sync failed');
        showNotification('Failed to sync data: ' + err.message, 'error');
        hideLoading();
      });
    }
  }

  function loadFromDrive() {
    if (!state.isDriveConnected) {
      showNotification('Please connect to Google Drive first', 'error');
      return;
    }

    if (!state.driveFileId) {
      showNotification('No existing data file found in Drive', 'error');
      return;
    }

    showLoading('Loading data from Google Drive...');
    updateSyncProgress(0, 'Connecting...');

    gapi.client.drive.files.get({
      fileId: state.driveFileId,
      alt: 'media'
    }).then(response => {
      updateSyncProgress(50, 'Processing data...');
      
      const loadedData = response.result;
      
      // Validate loaded data
      if (!loadedData.users || !loadedData.packages || !loadedData.orders) {
        throw new Error('Invalid data format in Drive file');
      }
      
      // Update local state
      state.users = loadedData.users;
      state.packages = loadedData.packages;
      state.orders = loadedData.orders;
      
      // Save to localStorage
      saveUsers();
      savePackages();
      saveOrders();
      
      // Update UI
      updateSyncProgress(100, 'Load complete!');
      showNotification('Data loaded from Google Drive successfully', 'success');
      
      // Refresh UI
      renderPackages();
      renderAdminUsers();
      renderAdminOrders();
      
      setTimeout(hideLoading, 1000);
    }).catch(err => {
      updateSyncProgress(0, 'Load failed');
      showNotification('Failed to load data: ' + err.message, 'error');
      hideLoading();
    });
  }

  function forceSync() {
    if (!state.isDriveConnected) {
      showNotification('Please connect to Google Drive first', 'error');
      return;
    }

    showLoading('Forcing full sync with Google Drive...');
    
    // First load from Drive, then sync back
    loadFromDrive().then(() => {
      syncToDrive();
    }).catch(err => {
      hideLoading();
      showNotification('Force sync failed: ' + err.message, 'error');
    });
  }

  function updateSyncStatus() {
    if (state.isDriveConnected) {
      elements.syncStatus.textContent = '🟢 Connected to Drive';
      elements.syncStatus.classList.remove('disconnected');
      elements.syncStatus.classList.add('connected');
    } else {
      elements.syncStatus.textContent = '⚫ Local Only';
      elements.syncStatus.classList.remove('connected');
      elements.syncStatus.classList.add('disconnected');
    }
  }

  function updateSyncProgress(percent, message) {
    elements.adminSyncProgress.style.width = `${percent}%`;
    elements.adminSyncText.textContent = message;
  }

  // Utility functions
  function showNotification(message, type = 'info') {
    elements.notificationText.textContent = message;
    elements.notification.className = `notification ${type} active`;
    
    setTimeout(() => {
      elements.notification.classList.remove('active');
    }, 5000);
  }

  function showLoading(message = 'Processing...') {
    elements.loadingOverlay.querySelector('.loading-text').textContent = message;
    elements.loadingOverlay.classList.remove('hidden');
  }

  function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
  }

  function checkPasswordStrength(password) {
    const strengthBar = elements.passwordStrengthBar;
    const container = elements.passwordStrength;
    
    // Reset classes
    container.classList.remove('weak', 'medium', 'strong');
    
    if (!password) {
      strengthBar.style.width = '0%';
      return;
    }
    
    // Calculate strength
    let strength = 0;
    if (password.length > 5) strength += 1;
    if (password.length > 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Update UI
    if (strength <= 2) {
      container.classList.add('weak');
    } else if (strength <= 4) {
      container.classList.add('medium');
    } else {
      container.classList.add('strong');
    }
  }

  function copyUpiId() {
    navigator.clipboard.writeText(elements.upiId.textContent)
      .then(() => showNotification('UPI ID copied to clipboard', 'success'))
      .catch(() => showNotification('Failed to copy UPI ID', 'error'));
  }

  // Public API
  return {
    init,
    checkPasswordStrength,
    copyUpiId
  };
})();

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', app.init);
