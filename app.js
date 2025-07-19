// Mobile Legends Gaming Recharge Website - Fixed Application Logic
class MLBBRechargeApp {
    constructor() {
        this.currentUser = null;
        this.currentAdmin = null;
        this.selectedPackage = null;
        this.orders = [];
        this.users = [];
        this.captchaValue = '';
        this.sessionTimeout = null;
        this.clickTimeout = null; // Fix for multiple clicks
        
        // Application data from backend
        this.data = {
            diamond_packages: [
                { type: "double_bonus", diamonds: "50+50", price: 80, category: "Double Bonus", recommended: false },
                { type: "double_bonus", diamonds: "150+150", price: 260, category: "Double Bonus", recommended: false },
                { type: "double_bonus", diamonds: "250+250", price: 370, category: "Double Bonus", recommended: false },
                { type: "double_bonus", diamonds: "500+500", price: 680, category: "Double Bonus", recommended: true },
                { type: "regular", diamonds: "11", price: 25, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "86", price: 115, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "172", price: 230, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "257", price: 340, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "344", price: 460, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "429", price: 570, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "514", price: 680, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "706", price: 940, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "1412", price: 1880, category: "Regular Diamonds", recommended: false },
                { type: "regular", diamonds: "2195", price: 2900, category: "Regular Diamonds", recommended: false },
                { type: "weekly_pass", diamonds: "Weekly Pass", price: 130, category: "Weekly Pass", recommended: false }
            ],
            mlbb_servers: [
                { id: 2001, name: "Advanced Server", region: "Global" },
                { id: 2517, name: "North America", region: "NA" },
                { id: 3561, name: "Europe", region: "EU" },
                { id: 4012, name: "Middle East", region: "ME" },
                { id: 5089, name: "India", region: "IN" },
                { id: 6147, name: "Philippines", region: "PH" },
                { id: 7238, name: "Indonesia", region: "ID" },
                { id: 8165, name: "Malaysia", region: "MY" },
                { id: 9044, name: "Singapore", region: "SG" },
                { id: 10001, name: "Thailand", region: "TH" },
                { id: 11234, name: "Vietnam", region: "VN" },
                { id: 12567, name: "Myanmar", region: "MM" },
                { id: 13890, name: "Cambodia", region: "KH" },
                { id: 14123, name: "Laos", region: "LA" }
            ],
            payment_methods: [
                { id: "upi", name: "UPI Payment", icon: "💳", processing_time: "Instant" },
                { id: "card", name: "Credit/Debit Card", icon: "💳", processing_time: "1-2 minutes" },
                { id: "netbanking", name: "Net Banking", icon: "🏦", processing_time: "2-3 minutes" },
                { id: "wallet", name: "Digital Wallet", icon: "👝", processing_time: "Instant" },
                { id: "paytm", name: "Paytm", icon: "📱", processing_time: "Instant" },
                { id: "gpay", name: "Google Pay", icon: "🔵", processing_time: "Instant" },
                { id: "phonepe", name: "PhonePe", icon: "🟣", processing_time: "Instant" }
            ],
            admin_users: [
                { username: "admin", password: "admin123", role: "super_admin", permissions: ["orders", "users", "analytics", "packages"] },
                { username: "manager", password: "manager123", role: "manager", permissions: ["orders", "users"] }
            ]
        };

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        this.loadStoredData();
        this.bindEvents();
        this.renderPackages();
        this.populateServers();
        this.populatePaymentMethods();
        this.generateCaptcha();
        this.updateUI();
        this.initSessionTimeout();
    }

    loadStoredData() {
        try {
            const storedUsers = localStorage.getItem('mlbb_users');
            const storedOrders = localStorage.getItem('mlbb_orders');
            const storedCurrentUser = localStorage.getItem('mlbb_current_user');
            
            if (storedUsers) this.users = JSON.parse(storedUsers);
            if (storedOrders) this.orders = JSON.parse(storedOrders);
            if (storedCurrentUser) this.currentUser = JSON.parse(storedCurrentUser);
        } catch (e) {
            console.log('Error loading stored data:', e);
            // Reset if corrupted
            localStorage.removeItem('mlbb_users');
            localStorage.removeItem('mlbb_orders');
            localStorage.removeItem('mlbb_current_user');
        }
    }

    saveData() {
        try {
            localStorage.setItem('mlbb_users', JSON.stringify(this.users));
            localStorage.setItem('mlbb_orders', JSON.stringify(this.orders));
            localStorage.setItem('mlbb_current_user', JSON.stringify(this.currentUser));
        } catch (e) {
            console.log('Error saving data:', e);
        }
    }

    bindEvents() {
        // Prevent multiple clicks helper
        const preventMultiple = (callback) => {
            return (...args) => {
                if (this.clickTimeout) return;
                this.clickTimeout = setTimeout(() => {
                    this.clickTimeout = null;
                }, 500);
                callback(...args);
            };
        };

        // Navigation events - Fixed click handlers
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const dashboardBtn = document.getElementById('dashboardBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const startRechargeBtn = document.getElementById('startRechargeBtn');
        const adminAccessBtn = document.getElementById('adminAccessBtn');

        if (loginBtn) {
            loginBtn.onclick = preventMultiple((e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showModal('loginModal');
            });
        }

        if (signupBtn) {
            signupBtn.onclick = preventMultiple((e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showModal('signupModal');
            });
        }

        if (dashboardBtn) {
            dashboardBtn.onclick = preventMultiple((e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showDashboard();
            });
        }

        if (logoutBtn) {
            logoutBtn.onclick = preventMultiple((e) => {
                e.preventDefault();
                e.stopPropagation();
                this.logout();
            });
        }

        if (startRechargeBtn) {
            startRechargeBtn.onclick = preventMultiple((e) => {
                e.preventDefault();
                e.stopPropagation();
                this.startRecharge();
            });
        }

        if (adminAccessBtn) {
            adminAccessBtn.onclick = preventMultiple((e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showModal('adminLoginModal');
            });
        }

        // Form events
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const rechargeForm = document.getElementById('rechargeForm');
        const profileForm = document.getElementById('profileForm');
        const adminLoginForm = document.getElementById('adminLoginForm');

        if (loginForm) {
            loginForm.onsubmit = (e) => this.handleLogin(e);
        }
        if (signupForm) {
            signupForm.onsubmit = (e) => this.handleSignup(e);
        }
        if (rechargeForm) {
            rechargeForm.onsubmit = (e) => this.handleOrderSubmit(e);
        }
        if (profileForm) {
            profileForm.onsubmit = (e) => this.handleProfileUpdate(e);
        }
        if (adminLoginForm) {
            adminLoginForm.onsubmit = (e) => this.handleAdminLogin(e);
        }

        // Input validation
        const mlbbIdInput = document.getElementById('mlbbId');
        if (mlbbIdInput) {
            mlbbIdInput.oninput = (e) => this.validateMLBBId(e);
        }

        // Button events
        const changePackageBtn = document.getElementById('changePackageBtn');
        const refreshCaptchaBtn = document.getElementById('refreshCaptcha');
        const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
        const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');

        if (changePackageBtn) {
            changePackageBtn.onclick = preventMultiple(() => this.showLandingPage());
        }
        if (refreshCaptchaBtn) {
            refreshCaptchaBtn.onclick = preventMultiple(() => this.generateCaptcha());
        }
        if (confirmPaymentBtn) {
            confirmPaymentBtn.onclick = preventMultiple(() => this.confirmPayment());
        }
        if (cancelPaymentBtn) {
            cancelPaymentBtn.onclick = preventMultiple(() => this.hideModal('paymentModal'));
        }

        // Modal close events - Fixed to prevent event bubbling
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = btn.getAttribute('data-modal');
                this.hideModal(modal);
            };
        });

        // Auth link events
        const switchToSignupLink = document.getElementById('switchToSignupLink');
        const switchToLoginLink = document.getElementById('switchToLoginLink');

        if (switchToSignupLink) {
            switchToSignupLink.onclick = (e) => {
                e.preventDefault();
                this.hideModal('loginModal');
                this.showModal('signupModal');
            };
        }
        if (switchToLoginLink) {
            switchToLoginLink.onclick = (e) => {
                e.preventDefault();
                this.hideModal('signupModal');
                this.showModal('loginModal');
            };
        }

        // Dashboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.switchTab(e.target.dataset.tab);
            };
        });

        // Admin tabs
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.switchAdminTab(e.target.dataset.tab);
            };
        });

        // Modal backdrop click - Fixed to only close on backdrop
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && !e.target.querySelector('.modal-content:hover')) {
                e.target.classList.add('hidden');
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const visibleModal = document.querySelector('.modal:not(.hidden)');
                if (visibleModal) {
                    visibleModal.classList.add('hidden');
                }
            }
        });
    }

    // Authentication Methods - Fixed form handling
    handleLogin(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Simulate rate limiting
        const now = Date.now();
        const lastAttempt = localStorage.getItem('last_login_attempt');
        if (lastAttempt && now - parseInt(lastAttempt) < 5000) {
            this.showNotification('Please wait before trying again', 'error');
            return;
        }
        localStorage.setItem('last_login_attempt', now.toString());

        const user = this.users.find(u => (u.email === email || u.phone === email) && u.password === password);
        
        if (user) {
            if (user.banned) {
                this.showNotification('Account is banned. Contact administrator.', 'error');
                return;
            }
            
            this.currentUser = user;
            this.saveData();
            this.hideModal('loginModal');
            this.updateUI();
            this.showNotification('Login successful!', 'success');
            this.initSessionTimeout();
        } else {
            this.showNotification('Invalid credentials', 'error');
        }
    }

    handleSignup(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const email = document.getElementById('signupEmail').value.trim();
        const phone = document.getElementById('signupPhone').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!email || !phone || !password || !confirmPassword) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        if (this.users.find(u => u.email === email)) {
            this.showNotification('Email already exists', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            email,
            phone,
            password,
            registrationDate: new Date().toISOString(),
            verified: false,
            banned: false
        };

        this.users.push(newUser);
        this.currentUser = newUser;
        this.saveData();
        this.hideModal('signupModal');
        this.updateUI();
        this.showNotification('Account created successfully!', 'success');
        this.simulateEmailVerification();
    }

    simulateEmailVerification() {
        setTimeout(() => {
            this.showNotification('Email verification sent! (Simulated)', 'info');
            setTimeout(() => {
                if (this.currentUser) {
                    this.currentUser.verified = true;
                    this.saveData();
                    this.showNotification('Email verified successfully!', 'success');
                }
            }, 3000);
        }, 1000);
    }

    logout() {
        this.currentUser = null;
        this.currentAdmin = null;
        localStorage.removeItem('mlbb_current_user');
        this.updateUI();
        this.showLandingPage();
        this.showNotification('Logged out successfully', 'info');
        this.clearSessionTimeout();
    }

    initSessionTimeout() {
        this.clearSessionTimeout();
        this.sessionTimeout = setTimeout(() => {
            if (this.currentUser) {
                this.logout();
                this.showNotification('Session expired. Please login again.', 'info');
            }
        }, 30 * 60 * 1000); // 30 minutes
    }

    clearSessionTimeout() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
    }

    // Admin Authentication - Fixed
    handleAdminLogin(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;

        if (!username || !password) {
            this.showNotification('Please enter username and password', 'error');
            return;
        }

        const admin = this.data.admin_users.find(a => a.username === username && a.password === password);
        
        if (admin) {
            this.currentAdmin = admin;
            this.hideModal('adminLoginModal');
            this.showAdminPanel();
            this.showNotification('Admin login successful!', 'success');
        } else {
            this.showNotification('Invalid admin credentials', 'error');
        }
    }

    // Package Management - Fixed click handling
    renderPackages() {
        const grid = document.getElementById('packagesGrid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.data.diamond_packages.forEach((pkg, index) => {
            const packageCard = document.createElement('div');
            packageCard.className = `package-card ${pkg.recommended ? 'recommended' : ''}`;
            packageCard.innerHTML = `
                <div class="package-header">
                    <div class="package-category">${pkg.category}</div>
                    <div class="package-diamonds">${pkg.diamonds}</div>
                    <div class="package-price">₹${pkg.price}</div>
                </div>
                <button class="btn package-btn" data-package-index="${index}">
                    Select Package
                </button>
            `;
            
            // Fixed event binding for package selection
            const btn = packageCard.querySelector('.package-btn');
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectPackage(pkg);
            };
            
            grid.appendChild(packageCard);
        });
    }

    selectPackage(pkg) {
        this.selectedPackage = pkg;
        this.showOrderForm();
        this.updateSelectedPackage();
        this.updateOrderSummary();
        this.showNotification(`Selected: ${pkg.diamonds} Diamonds`, 'info');
    }

    updateSelectedPackage() {
        const container = document.getElementById('selectedPackage');
        if (container && this.selectedPackage) {
            container.innerHTML = `
                <div class="selected-package-info">
                    <h4>${this.selectedPackage.category}</h4>
                    <div class="package-details">
                        <span class="diamonds">${this.selectedPackage.diamonds}</span>
                        <span class="price">₹${this.selectedPackage.price}</span>
                    </div>
                </div>
            `;
        }
    }

    // Order Management - Fixed
    startRecharge() {
        if (!this.currentUser) {
            this.showModal('loginModal');
            this.showNotification('Please login to continue', 'info');
            return;
        }
        // Just scroll to packages if already on landing page
        document.getElementById('packagesGrid').scrollIntoView({ behavior: 'smooth' });
    }

    showOrderForm() {
        if (!this.currentUser) {
            this.showModal('loginModal');
            this.showNotification('Please login to continue', 'info');
            return;
        }
        this.hideAllSections();
        document.getElementById('orderForm').classList.remove('hidden');
    }

    handleOrderSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.validateOrderForm()) {
            return;
        }

        if (!this.validateCaptcha()) {
            this.showNotification('Invalid CAPTCHA. Please try again.', 'error');
            this.generateCaptcha();
            return;
        }

        this.showPaymentModal();
    }

    validateOrderForm() {
        const mlbbId = document.getElementById('mlbbId').value.trim();
        const serverId = document.getElementById('serverId').value;

        if (!mlbbId) {
            this.showNotification('Please enter your MLBB ID', 'error');
            return false;
        }

        if (!this.validateMLBBId({ target: { value: mlbbId } })) {
            this.showNotification('Invalid MLBB ID format', 'error');
            return false;
        }

        if (!serverId) {
            this.showNotification('Please select a server', 'error');
            return false;
        }

        if (!this.selectedPackage) {
            this.showNotification('Please select a package', 'error');
            return false;
        }

        if (!this.getSelectedPaymentMethod()) {
            this.showNotification('Please select a payment method', 'error');
            return false;
        }

        return true;
    }

    validateMLBBId(e) {
        const input = e.target;
        const value = input.value.trim();
        const errorDiv = document.getElementById('mlbbIdError');
        
        if (!value) {
            input.classList.remove('invalid', 'valid');
            if (errorDiv) errorDiv.classList.add('hidden');
            return false;
        }

        // MLBB ID should be numeric only and 6-12 digits
        const isValid = /^\d{6,12}$/.test(value);
        
        if (!isValid) {
            input.classList.add('invalid');
            input.classList.remove('valid');
            if (errorDiv) {
                errorDiv.textContent = 'MLBB ID must be 6-12 digits only';
                errorDiv.classList.remove('hidden');
            }
            return false;
        } else {
            input.classList.remove('invalid');
            input.classList.add('valid');
            if (errorDiv) errorDiv.classList.add('hidden');
            return true;
        }
    }

    validateCaptcha() {
        const input = document.getElementById('captchaInput').value.trim();
        return input.toLowerCase() === this.captchaValue.toLowerCase();
    }

    generateCaptcha() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.captchaValue = result;
        const captchaText = document.getElementById('captchaText');
        if (captchaText) {
            captchaText.textContent = result;
        }
        // Clear captcha input
        const captchaInput = document.getElementById('captchaInput');
        if (captchaInput) {
            captchaInput.value = '';
        }
    }

    getSelectedPaymentMethod() {
        const selected = document.querySelector('.payment-method.selected');
        return selected ? selected.dataset.method : null;
    }

    updateOrderSummary() {
        if (this.selectedPackage) {
            const summaryPackage = document.getElementById('summaryPackage');
            const summaryPrice = document.getElementById('summaryPrice');
            const summaryTotal = document.getElementById('summaryTotal');
            
            if (summaryPackage) summaryPackage.textContent = `${this.selectedPackage.diamonds} Diamonds`;
            if (summaryPrice) summaryPrice.textContent = `₹${this.selectedPackage.price}`;
            if (summaryTotal) summaryTotal.textContent = `₹${this.selectedPackage.price}`;
        }
    }

    showPaymentModal() {
        const mlbbId = document.getElementById('mlbbId').value.trim();
        const serverId = document.getElementById('serverId').value;
        const serverName = this.data.mlbb_servers.find(s => s.id == serverId)?.name;

        const paymentMlbbId = document.getElementById('paymentMlbbId');
        const paymentServer = document.getElementById('paymentServer');
        const paymentPackage = document.getElementById('paymentPackage');
        const paymentAmount = document.getElementById('paymentAmount');

        if (paymentMlbbId) paymentMlbbId.textContent = mlbbId;
        if (paymentServer) paymentServer.textContent = `${serverName} (${serverId})`;
        if (paymentPackage) paymentPackage.textContent = `${this.selectedPackage.diamonds} Diamonds`;
        if (paymentAmount) paymentAmount.textContent = `₹${this.selectedPackage.price}`;

        this.showModal('paymentModal');
    }

    confirmPayment() {
        const orderId = 'MLB' + Date.now();
        const mlbbId = document.getElementById('mlbbId').value.trim();
        const serverId = document.getElementById('serverId').value;
        const paymentMethod = this.getSelectedPaymentMethod();

        const order = {
            id: orderId,
            userId: this.currentUser.id,
            userEmail: this.currentUser.email,
            mlbbId: mlbbId,
            serverId: serverId,
            serverName: this.data.mlbb_servers.find(s => s.id == serverId)?.name,
            package: this.selectedPackage,
            paymentMethod: paymentMethod,
            amount: this.selectedPackage.price,
            status: 'pending',
            orderText: `ID: ${mlbbId} | Server ID: ${serverId}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            adminNotes: ''
        };

        this.orders.push(order);
        this.saveData();
        this.hideModal('paymentModal');
        this.showNotification('Order placed successfully!', 'success');
        this.showDashboard();

        // Simulate order processing
        this.simulateOrderProcessing(orderId);
    }

    simulateOrderProcessing(orderId) {
        setTimeout(() => {
            const order = this.orders.find(o => o.id === orderId);
            if (order && this.currentUser) {
                order.status = 'processing';
                order.updatedAt = new Date().toISOString();
                this.saveData();
                this.showNotification('Order is being processed', 'info');
                this.updateDashboard();
            }
        }, 10000);

        setTimeout(() => {
            const order = this.orders.find(o => o.id === orderId);
            if (order && this.currentUser) {
                order.status = 'completed';
                order.updatedAt = new Date().toISOString();
                this.saveData();
                this.showNotification('Order completed! Diamonds delivered.', 'success');
                this.updateDashboard();
            }
        }, 30000);
    }

    // UI Management - Fixed modal handling
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    hideAllSections() {
        const sections = ['landingPage', 'orderForm', 'userDashboard', 'adminPanel'];
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('hidden');
            }
        });
    }

    showLandingPage() {
        this.hideAllSections();
        const landing = document.getElementById('landingPage');
        if (landing) {
            landing.classList.remove('hidden');
        }
    }

    showDashboard() {
        if (!this.currentUser) {
            this.showModal('loginModal');
            return;
        }
        this.hideAllSections();
        const dashboard = document.getElementById('userDashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            this.updateDashboard();
        }
    }

    showAdminPanel() {
        if (!this.currentAdmin) {
            this.showModal('adminLoginModal');
            return;
        }
        this.hideAllSections();
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.classList.remove('hidden');
            this.updateAdminPanel();
        }
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const userMenu = document.getElementById('userMenu');

        if (loginBtn && signupBtn && userMenu) {
            if (this.currentUser) {
                loginBtn.style.display = 'none';
                signupBtn.style.display = 'none';
                userMenu.classList.remove('hidden');
            } else {
                loginBtn.style.display = 'block';
                signupBtn.style.display = 'block';
                userMenu.classList.add('hidden');
            }
        }
    }

    updateDashboard() {
        if (!this.currentUser) return;

        const userOrders = this.orders.filter(o => o.userId === this.currentUser.id);
        const totalSpent = userOrders.reduce((sum, order) => sum + order.amount, 0);
        const totalDiamonds = userOrders.filter(o => o.status === 'completed').reduce((sum, order) => {
            const diamonds = order.package.diamonds.toString();
            if (diamonds.includes('+')) {
                const parts = diamonds.split('+');
                return sum + parseInt(parts[0]) + parseInt(parts[1]);
            } else if (diamonds === 'Weekly Pass') {
                return sum + 0;
            } else {
                return sum + parseInt(diamonds) || 0;
            }
        }, 0);

        const totalOrdersEl = document.getElementById('totalOrders');
        const totalSpentEl = document.getElementById('totalSpent');
        const totalDiamondsEl = document.getElementById('totalDiamonds');

        if (totalOrdersEl) totalOrdersEl.textContent = userOrders.length;
        if (totalSpentEl) totalSpentEl.textContent = `₹${totalSpent}`;
        if (totalDiamondsEl) totalDiamondsEl.textContent = totalDiamonds;

        // Update orders table
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = '';

            userOrders.slice().reverse().forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.package.diamonds} Diamonds</td>
                    <td>₹${order.amount}</td>
                    <td><span class="status status--${order.status}">${order.status}</span></td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn--outline btn--sm" onclick="app.showOrderDetails('${order.id}')">
                            View Details
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Update profile form
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');
        if (profileEmail) profileEmail.value = this.currentUser.email;
        if (profilePhone) profilePhone.value = this.currentUser.phone || '';
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activePane = document.getElementById(tabName + 'Tab');
        
        if (activeBtn) activeBtn.classList.add('active');
        if (activePane) activePane.classList.remove('hidden');
    }

    showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const content = document.getElementById('orderDetailsContent');
        if (content) {
            content.innerHTML = `
                <div class="order-detail-section">
                    <h4>Order Information</h4>
                    <div class="detail-row">
                        <span>Order ID:</span>
                        <span>${order.id}</span>
                    </div>
                    <div class="detail-row">
                        <span>MLBB ID:</span>
                        <span>${order.mlbbId}</span>
                    </div>
                    <div class="detail-row">
                        <span>Server:</span>
                        <span>${order.serverName} (${order.serverId})</span>
                    </div>
                    <div class="detail-row">
                        <span>Package:</span>
                        <span>${order.package.diamonds} Diamonds</span>
                    </div>
                    <div class="detail-row">
                        <span>Amount:</span>
                        <span>₹${order.amount}</span>
                    </div>
                    <div class="detail-row">
                        <span>Payment Method:</span>
                        <span>${order.paymentMethod}</span>
                    </div>
                    <div class="detail-row">
                        <span>Status:</span>
                        <span class="status status--${order.status}">${order.status}</span>
                    </div>
                    <div class="detail-row">
                        <span>Order Date:</span>
                        <span>${new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                        <span>Last Updated:</span>
                        <span>${new Date(order.updatedAt).toLocaleString()}</span>
                    </div>
                </div>
                <div class="order-detail-section">
                    <h4>Order Text</h4>
                    <div class="order-text">${order.orderText}</div>
                </div>
                ${order.adminNotes ? `
                    <div class="order-detail-section">
                        <h4>Admin Notes</h4>
                        <div class="admin-notes">${order.adminNotes}</div>
                    </div>
                ` : ''}
            `;
        }

        this.showModal('orderDetailsModal');
    }

    handleProfileUpdate(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const email = document.getElementById('profileEmail').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        if (!email) {
            this.showNotification('Email is required', 'error');
            return;
        }

        if (currentPassword && currentPassword !== this.currentUser.password) {
            this.showNotification('Incorrect current password', 'error');
            return;
        }

        if (newPassword && newPassword.length < 6) {
            this.showNotification('New password must be at least 6 characters', 'error');
            return;
        }

        this.currentUser.email = email;
        this.currentUser.phone = phone;
        if (newPassword) {
            this.currentUser.password = newPassword;
        }

        this.saveData();
        this.showNotification('Profile updated successfully!', 'success');
        
        // Clear password fields
        const currentPasswordField = document.getElementById('currentPassword');
        const newPasswordField = document.getElementById('newPassword');
        if (currentPasswordField) currentPasswordField.value = '';
        if (newPasswordField) newPasswordField.value = '';
    }

    // Admin Panel Methods
    updateAdminPanel() {
        this.updateAdminOrders();
        this.updateAdminUsers();
    }

    switchAdminTab(tabName) {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.admin-tab-pane').forEach(pane => pane.classList.add('hidden'));
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const activePane = document.getElementById(tabName + 'Tab');
        
        if (activeBtn) activeBtn.classList.add('active');
        if (activePane) activePane.classList.remove('hidden');

        if (tabName === 'adminOrders') this.updateAdminOrders();
        if (tabName === 'adminUsers') this.updateAdminUsers();
    }

    updateAdminOrders() {
        const tbody = document.getElementById('adminOrdersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.orders.slice().reverse().forEach(order => {
            const user = this.users.find(u => u.id === order.userId);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${user ? user.email : 'Unknown'}</td>
                <td>${order.mlbbId}</td>
                <td>${order.package.diamonds}</td>
                <td>₹${order.amount}</td>
                <td>
                    <select class="form-control" onchange="app.updateOrderStatus('${order.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn--outline btn--sm" onclick="app.showAdminOrderDetails('${order.id}')">
                        Details
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateAdminUsers() {
        const tbody = document.getElementById('adminUsersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        this.users.forEach(user => {
            const userOrders = this.orders.filter(o => o.userId === user.id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${new Date(user.registrationDate).toLocaleDateString()}</td>
                <td>${userOrders.length}</td>
                <td>
                    <span class="status ${user.banned ? 'status--error' : 'status--success'}">
                        ${user.banned ? 'Banned' : 'Active'}
                    </span>
                </td>
                <td>
                    <button class="btn btn--outline btn--sm" onclick="app.toggleUserBan(${user.id})">
                        ${user.banned ? 'Unban' : 'Ban'}
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            order.updatedAt = new Date().toISOString();
            this.saveData();
            this.showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
            
            // Update user dashboard if they're viewing it
            if (this.currentUser && !document.getElementById('userDashboard').classList.contains('hidden')) {
                this.updateDashboard();
            }
        }
    }

    toggleUserBan(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.banned = !user.banned;
            this.saveData();
            this.updateAdminUsers();
            this.showNotification(`User ${user.banned ? 'banned' : 'unbanned'} successfully`, 'success');
        }
    }

    showAdminOrderDetails(orderId) {
        // Similar to showOrderDetails but with admin context
        this.showOrderDetails(orderId);
    }

    // Utility Methods
    populateServers() {
        const select = document.getElementById('serverId');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Server</option>';
        
        this.data.mlbb_servers.forEach(server => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = `${server.name} (${server.id}) - ${server.region}`;
            select.appendChild(option);
        });
    }

    populatePaymentMethods() {
        const container = document.getElementById('paymentMethods');
        if (!container) return;
        
        container.innerHTML = '';

        this.data.payment_methods.forEach(method => {
            const methodDiv = document.createElement('div');
            methodDiv.className = 'payment-method';
            methodDiv.dataset.method = method.id;
            methodDiv.innerHTML = `
                <div class="payment-icon">${method.icon}</div>
                <div class="payment-name">${method.name}</div>
                <div class="payment-time">${method.processing_time}</div>
            `;
            methodDiv.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
                methodDiv.classList.add('selected');
            };
            container.appendChild(methodDiv);
        });
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the application when DOM is ready
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new MLBBRechargeApp();
        window.app = app; // Global access
    });
} else {
    app = new MLBBRechargeApp();
    window.app = app; // Global access
}