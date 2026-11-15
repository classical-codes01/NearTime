// ===== AUTH STATE =====
const authState = {
    activeTab: 'login',
    accountType: 'customer'
};

// ===== MOCK USER STORE (localStorage) =====
const UserStore = {
    getAll() {
        return JSON.parse(localStorage.getItem('neartime_users') || '[]');
    },
    save(users) {
        localStorage.setItem('neartime_users', JSON.stringify(users));
    },
    add(user) {
        const users = this.getAll();
        users.push(user);
        this.save(users);
    },
    findByEmail(email) {
        return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    setLoggedIn(user) {
        localStorage.setItem('neartime_logged_in', JSON.stringify({
            ...user,
            loginTime: new Date().toISOString()
        }));
    },
    getLoggedIn() {
        return JSON.parse(localStorage.getItem('neartime_logged_in') || 'null');
    },
    logout() {
        localStorage.removeItem('neartime_logged_in');
    }
};

// ===== TAB SWITCHING =====
function switchTab(tab) {
    authState.activeTab = tab;

    // Update tab buttons
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');

    // Slide indicator
    const slider = document.getElementById('tabSlider');
    slider.classList.toggle('to-register', tab === 'register');

    // Show/hide forms
    document.getElementById('loginForm').classList.toggle('active', tab === 'login');
    document.getElementById('registerForm').classList.toggle('active', tab === 'register');

    // Clear errors
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('registerError').classList.remove('show');
}

// ===== ACCOUNT TYPE SELECTION =====
function selectType(type) {
    authState.accountType = type;

    document.getElementById('typeCustomer').classList.toggle('active', type === 'customer');
    document.getElementById('typeBusiness').classList.toggle('active', type === 'business');

    // Show/hide business-only fields
    const businessFields = ['businessNameGroup', 'businessTypeGroup'];
    businessFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = type === 'business' ? 'flex' : 'none';
        }
    });

    // Make business fields required when visible
    const bizName = document.getElementById('regBusinessName');
    const bizType = document.getElementById('regBusinessType');
    if (bizName) bizName.required = type === 'business';
    if (bizType) bizType.required = type === 'business';
}

// ===== PASSWORD TOGGLE =====
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ===== PASSWORD STRENGTH =====
function checkPasswordStrength(password) {
    const container = document.getElementById('passwordStrength');
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');

    if (!password) {
        container.classList.remove('visible');
        return;
    }

    container.classList.add('visible');

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
        { label: 'Very Weak', color: '#ef4444', width: '20%' },
        { label: 'Weak',      color: '#f97316', width: '40%' },
        { label: 'Fair',      color: '#eab308', width: '60%' },
        { label: 'Good',      color: '#22c55e', width: '80%' },
        { label: 'Strong',    color: '#10b981', width: '100%' }
    ];

    const level = levels[Math.min(score - 1, 4)] || levels[0];
    fill.style.width = level.width;
    fill.style.background = level.color;
    label.textContent = level.label;
    label.style.color = level.color;
}

// ===== SHOW ERROR =====
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.add('show');
}

function hideError(elementId) {
    document.getElementById(elementId).classList.remove('show');
}

// ===== TOAST =====
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== HANDLE LOGIN =====
function handleLogin(e) {
    e.preventDefault();
    hideError('loginError');

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;

    // Validation
    if (!email || !password) {
        showError('loginError', 'Please fill in all fields.');
        return;
    }

    // Check user store
    const user = UserStore.findByEmail(email);

    if (!user) {
        showError('loginError', 'No account found with this email. Please register first.');
        return;
    }

    if (user.password !== btoa(password)) {
        showError('loginError', 'Incorrect password. Please try again.');
        return;
    }

    // Success
    UserStore.setLoggedIn(user);

    if (remember) {
        localStorage.setItem('neartime_remember', email);
    } else {
        localStorage.removeItem('neartime_remember');
    }

    showToast(`Welcome back, ${user.firstName}! 🎉`);

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ===== HANDLE REGISTER =====
function handleRegister(e) {
    e.preventDefault();
    hideError('registerError');

    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const city = document.getElementById('regCity').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Business fields
    const businessName = authState.accountType === 'business'
        ? document.getElementById('regBusinessName').value.trim()
        : '';
    const businessType = authState.accountType === 'business'
        ? document.getElementById('regBusinessType').value
        : '';

    // Validations
    if (!firstName || !lastName) {
        showError('registerError', 'Please enter your full name.');
        return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('registerError', 'Please enter a valid email address.');
        return;
    }

    if (!phone || phone.length < 10) {
        showError('registerError', 'Please enter a valid phone number.');
        return;
    }

    if (!city) {
        showError('registerError', 'Please enter your city.');
        return;
    }

    if (authState.accountType === 'business') {
        if (!businessName) {
            showError('registerError', 'Please enter your business name.');
            return;
        }
        if (!businessType) {
            showError('registerError', 'Please select your business type.');
            return;
        }
    }

    if (password.length < 8) {
        showError('registerError', 'Password must be at least 8 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        showError('registerError', 'Passwords do not match. Please try again.');
        return;
    }

    if (!agreeTerms) {
        showError('registerError', 'Please agree to the Terms of Service and Privacy Policy.');
        return;
    }

    // Check duplicate email
    if (UserStore.findByEmail(email)) {
        showError('registerError', 'An account with this email already exists. Please login instead.');
        return;
    }

    // Save user
    const newUser = {
        id: 'USER_' + Date.now(),
        firstName,
        lastName,
        email,
        phone,
        city,
        password: btoa(password),
        accountType: authState.accountType,
        businessName: businessName || null,
        businessType: businessType || null,
        createdAt: new Date().toISOString()
    };

    UserStore.add(newUser);
    UserStore.setLoggedIn(newUser);

    showToast(`Account created! Welcome, ${firstName}! 🎉`);

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1600);
}

// ===== SOCIAL LOGIN (Placeholder) =====
function socialLogin(provider) {
    showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`);
}

// ===== INIT =====
function init() {
    // Auto-fill remembered email
    const remembered = localStorage.getItem('neartime_remember');
    if (remembered) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
            emailInput.value = remembered;
            document.getElementById('rememberMe').checked = true;
        }
    }

    // Check if user is already logged in
    const loggedIn = UserStore.getLoggedIn();
    if (loggedIn) {
        // Optional: auto-redirect if already logged in
        // window.location.href = 'index.html';
    }

    // Check URL hash for tab
    if (window.location.hash === '#register') {
        switchTab('register');
    }
}

document.addEventListener('DOMContentLoaded', init);
