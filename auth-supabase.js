// ============================================================
//  NEARTIME — Auth with Supabase
//  Replaces localStorage-based auth with real Supabase Auth
// ============================================================

// ===== TAB SWITCHING =====
const authState = { activeTab: 'login', accountType: 'customer' };

function switchTab(tab) {
    authState.activeTab = tab;
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');
    document.getElementById('tabSlider').classList.toggle('to-register', tab === 'register');
    document.getElementById('loginForm').classList.toggle('active', tab === 'login');
    document.getElementById('registerForm').classList.toggle('active', tab === 'register');
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('registerError').classList.remove('show');
}

// ===== ACCOUNT TYPE =====
function selectType(type) {
    authState.accountType = type;
    document.getElementById('typeCustomer').classList.toggle('active', type === 'customer');
    document.getElementById('typeBusiness').classList.toggle('active', type === 'business');
    ['businessNameGroup', 'businessTypeGroup'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = type === 'business' ? 'flex' : 'none';
    });
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
    if (!password) { container.classList.remove('visible'); return; }
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

// ===== ERROR/TOAST HELPERS =====
function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.add('show');
}

function hideError(id) {
    document.getElementById(id).classList.remove('show');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.disabled = false;
    }
}

// ===== LOGIN WITH SUPABASE =====
async function handleLogin(e) {
    e.preventDefault();
    hideError('loginError');

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;

    if (!email || !password) {
        showError('loginError', 'Please fill in all fields.');
        return;
    }

    setLoading('loginSubmitBtn', true);

    try {
        const { data, error } = await window.db.auth.signInWithPassword({ email, password });

        if (error) {
            showError('loginError', error.message || 'Login failed. Please check your credentials.');
            return;
        }

        // Fetch profile from profiles table
        const { data: profile } = await window.db
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        const displayName = profile?.first_name || email.split('@')[0];
        showToast(`Welcome back, ${displayName}! 🎉`);

        setTimeout(() => { window.location.href = 'index.html'; }, 1500);

    } catch (err) {
        showError('loginError', 'Something went wrong. Please try again.');
        console.error(err);
    } finally {
        setLoading('loginSubmitBtn', false);
    }
}

// ===== REGISTER WITH SUPABASE =====
async function handleRegister(e) {
    e.preventDefault();
    hideError('registerError');

    const firstName       = document.getElementById('regFirstName').value.trim();
    const lastName        = document.getElementById('regLastName').value.trim();
    const email           = document.getElementById('regEmail').value.trim();
    const phone           = document.getElementById('regPhone').value.trim();
    const city            = document.getElementById('regCity').value.trim();
    const password        = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const agreeTerms      = document.getElementById('agreeTerms').checked;
    const businessName    = authState.accountType === 'business' ? document.getElementById('regBusinessName').value.trim() : null;
    const businessType    = authState.accountType === 'business' ? document.getElementById('regBusinessType').value : null;

    // Validations
    if (!firstName || !lastName) { showError('registerError', 'Please enter your full name.'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('registerError', 'Please enter a valid email address.'); return; }
    if (!phone || phone.replace(/\D/g,'').length < 10) { showError('registerError', 'Please enter a valid phone number.'); return; }
    if (!city) { showError('registerError', 'Please enter your city.'); return; }
    if (authState.accountType === 'business' && !businessName) { showError('registerError', 'Please enter your business name.'); return; }
    if (authState.accountType === 'business' && !businessType) { showError('registerError', 'Please select your business type.'); return; }
    if (password.length < 8) { showError('registerError', 'Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { showError('registerError', 'Passwords do not match.'); return; }
    if (!agreeTerms) { showError('registerError', 'Please agree to the Terms & Privacy Policy.'); return; }

    setLoading('registerSubmitBtn', true);

    try {
        // 1. Create auth user in Supabase
        const { data, error } = await window.db.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name:    firstName,
                    last_name:     lastName,
                    phone,
                    city,
                    account_type:  authState.accountType,
                    business_name: businessName,
                    business_type: businessType
                }
            }
        });

        if (error) {
            showError('registerError', error.message || 'Registration failed.');
            return;
        }

        // 2. Insert profile row (the trigger handles this if set up, else do it manually)
        if (data.user) {
            const { error: profileError } = await window.db.from('profiles').upsert({
                id:            data.user.id,
                first_name:    firstName,
                last_name:     lastName,
                email,
                phone,
                city,
                account_type:  authState.accountType,
                business_name: businessName || null,
                business_type: businessType || null,
                created_at:    new Date().toISOString()
            });

            if (profileError) console.warn('Profile insert warning:', profileError.message);
        }

        showToast(`Account created! Welcome, ${firstName}! 🎉`);

        // If email confirmation is disabled, redirect immediately
        if (data.session) {
            setTimeout(() => { window.location.href = 'index.html'; }, 1600);
        } else {
            // Email confirmation is enabled — tell the user
            showError('registerError', '');
            const errEl = document.getElementById('registerError');
            errEl.style.color = '#22c55e';
            errEl.style.borderColor = 'rgba(34,197,94,0.3)';
            errEl.style.background  = 'rgba(34,197,94,0.1)';
            errEl.textContent = '✅ Check your email to confirm your account, then login!';
            errEl.classList.add('show');
        }

    } catch (err) {
        showError('registerError', 'Something went wrong. Please try again.');
        console.error(err);
    } finally {
        setLoading('registerSubmitBtn', false);
    }
}

// ===== GOOGLE OAUTH LOGIN =====
async function socialLogin(provider) {
    if (provider === 'google') {
        const { error } = await window.db.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/index.html' }
        });
        if (error) showToast('Google login failed: ' + error.message);
    } else {
        showToast(`${provider} login coming soon!`);
    }
}

// ===== INIT =====
async function init() {
    // Check if already logged in
    const { data: { session } } = await window.db.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
        return;
    }

    // Check URL hash for tab switch
    if (window.location.hash === '#register') switchTab('register');

    // Listen for auth state changes (OAuth redirect)
    window.db.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            showToast('Login successful! Redirecting...');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
