// Configuration
const CONFIG = {
  GOOGLE_CLIENT_ID: '856647789843-teunsdqh8coqkicbq1rhgnesqpr5stkl.apps.googleusercontent.com',
  USER_DATA_FILENAME: 'pk-store-global-users.json',
  WHATSAPP_NUMBER: '9362584929',
  UPI_ID: 'BHARATPE.8R0E0I8U2N09755@fbpe'
};

// Default Admin User
const DEFAULT_USERS = [
  { 
    username: "admin", 
    password: "admin123", 
    role: "admin", 
    lastModified: Date.now() 
  }
];

// Google Drive Sync Class
class DriveSync {
  constructor() {
    this.CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID;
    this.USER_DATA_FILENAME = CONFIG.USER_DATA_FILENAME;
    this.fileId = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await new Promise((resolve) => gapi.load('client:auth2', resolve));
      await gapi.client.init({
        clientId: this.CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
      });
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Drive sync initialization failed:', error);
      return false;
    }
  }

  async authenticate() {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getGlobalUsers() {
    try {
      const response = await gapi.client.drive.files.list({
        q: `name='${this.USER_DATA_FILENAME}' and trashed=false`,
        fields: 'files(id)'
      });
      
      if (response.result.files.length === 0) {
        return await this.createGlobalUsersFile(DEFAULT_USERS);
      }
      
      this.fileId = response.result.files[0].id;
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
      const file = await gapi.client.drive.files.create({
        resource: {
          name: this.USER_DATA_FILENAME,
          mimeType: 'application/json'
        },
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(users)
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

  async authenticateUser(username, password) {
    try {
      const users = await this.getGlobalUsers();
      return users.find(u => u.username === username && u.password === password);
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  async addNewUser(newUser) {
    try {
      const users = await this.getGlobalUsers();
      if (users.some(u => u.username === newUser.username)) {
        throw new Error('Username already exists');
      }
      
      users.push({
        ...newUser,
        lastModified: Date.now()
      });
      
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
}

// Main Application Class
class PKStoreApp {
  constructor() {
    this.driveSync = new DriveSync();
    this.currentUser = null;
    this.isLoggedIn = false;
  }

  async initialize() {
    await this.driveSync.initialize();
    this.setupEventListeners();
    this.renderDiamondPackages();
    this.checkLoginState();
  }

  setupEventListeners() {
    // Login Form
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('test-login').addEventListener('click', () => {
      document.getElementById('username').value = 'admin';
      document.getElementById('password').value = 'admin123';
      this.handleLogin(new Event('submit'));
    });

    // Registration
    document.getElementById('show-register').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('register-modal').classList.remove('hidden');
    });
    document.getElementById('close-register').addEventListener('click', () => {
      document.getElementById('register-modal').classList.add('hidden');
    });
    document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

    // User Actions
    document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    document.getElementById('admin-panel-btn').addEventListener('click', () => this.showAdminPanel());
    document.getElementById('close-admin').addEventListener('click', () => this.hideAdminPanel());

    // Order Modal
    document.getElementById('order-form').addEventListener('submit', (e) => this.sendWhatsAppOrder(e));
    document.getElementById('close-order').addEventListener('click', () => this.closeOrderModal());

    // Admin Functions
    document.getElementById('add-user-btn').addEventListener('click', () => this.handleAddUser());
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      this.showNotification('Please enter both username and password', 'error');
      return;
    }

    try {
      this.showLoading(true);
      const user = await this.driveSync.authenticateUser(username, password);
      
      if (user) {
        this.currentUser = user;
        this.isLoggedIn = true;
        sessionStorage.setItem('pk-store-session', JSON.stringify({
          username: user.username,
          role: user.role,
          timestamp: Date.now()
        }));
        this.showStoreContent();
        this.showNotification(`Welcome back, ${user.username}!`, 'success');
      } else {
        this.showNotification('Invalid username or password', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Login failed. Please try again.', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  showStoreContent() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('store-content').classList.remove('hidden');
    document.getElementById('current-user').textContent = this.currentUser.username;
    document.getElementById('user-role').textContent = this.currentUser.role.toUpperCase();
    
    if (this.currentUser.role === 'admin') {
      document.getElementById('admin-panel-btn').classList.remove('hidden');
    }
  }

  logout() {
    this.currentUser = null;
    this.isLoggedIn = false;
    sessionStorage.removeItem('pk-store-session');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('store-content').classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    this.showNotification('Logged out successfully', 'success');
  }

  checkLoginState() {
    const session = sessionStorage.getItem('pk-store-session');
    if (session) {
      const { username, role, timestamp } = JSON.parse(session);
      if (Date.now() - timestamp < 86400000) { // 24 hours
        this.currentUser = { username, role };
        this.isLoggedIn = true;
        this.showStoreContent();
      } else {
        sessionStorage.removeItem('pk-store-session');
      }
    }
  }

  showLoading(show, text = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.querySelector('.loading-text');
    if (overlay && textEl) {
      textEl.textContent = text;
      overlay.classList.toggle('hidden', !show);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const textEl = document.getElementById('notification-text');
    if (notification && textEl) {
      textEl.textContent = message;
      notification.className = `notification ${type}`;
      notification.classList.remove('hidden');
      setTimeout(() => notification.classList.add('hidden'), 5000);
    }
  }

  // ... [Other methods remain the same] ...
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const app = new PKStoreApp();
  app.initialize();
  
  // Make functions globally available
  window.app = app;
  window.showOrderModal = (packageName, price) => {
    document.getElementById('order-package').textContent = packageName;
    document.getElementById('order-price').textContent = price;
    document.getElementById('order-modal').classList.remove('hidden');
  };
  window.copyUpiId = () => {
    navigator.clipboard.writeText(CONFIG.UPI_ID)
      .then(() => app.showNotification('UPI ID copied!', 'success'))
      .catch(() => app.showNotification('Failed to copy', 'error'));
  };
});
