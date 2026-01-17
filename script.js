// ========================
// FIREBASE INITIALIZATION
// ========================
firebase.initializeApp(CONFIG.FIREBASE);
const auth = firebase.auth();

// ========================
// EMAIL VERIFICATION SYSTEM (Now uses Backend)
// ========================
let userEmail = '';
let resendTimer = null;

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Send verification code (via Backend)
document.getElementById('email-verification-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('user-email');
    const email = emailInput.value.trim();
    const button = this.querySelector('button');
    const messageDiv = document.getElementById('form-message');
    
    if (!validateEmail(email)) {
        showMessage(messageDiv, '✗ Please enter a valid email address!', 'error');
        return;
    }
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    button.disabled = true;
    hideMessage(messageDiv);
    
    userEmail = email;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/send-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('email-step').style.display = 'none';
            document.getElementById('code-step').style.display = 'block';
            document.getElementById('display-email').textContent = email;
            startResendTimer();
            showMessage(messageDiv, '✓ Verification code sent! Check your email (and spam folder).', 'success');
        } else {
            showMessage(messageDiv, '✗ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(messageDiv, '✗ Failed to send code. Please check your connection.', 'error');
    } finally {
        button.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
        button.disabled = false;
    }
});

// Change email button
document.getElementById('changeEmailBtn').addEventListener('click', function() {
    document.getElementById('code-step').style.display = 'none';
    document.getElementById('email-step').style.display = 'block';
    hideMessage(document.getElementById('form-message'));
    clearResendTimer();
    clearCodeInputs();
});

// Code input auto-focus and paste handling
const codeInputs = document.querySelectorAll('.code-input');
codeInputs.forEach((input, index) => {
    input.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length === 1 && index < codeInputs.length - 1) {
            codeInputs[index + 1].focus();
        }
    });
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value === '' && index > 0) {
            codeInputs[index - 1].focus();
        }
    });
    
    input.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
        if (pastedData.length === 6) {
            codeInputs.forEach((inp, idx) => {
                inp.value = pastedData[idx] || '';
            });
            codeInputs[5].focus();
        }
    });
});

// Verify code (via Backend)
document.getElementById('code-verification-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('form-message');
    const button = this.querySelector('button[type="submit"]');
    
    let enteredCode = '';
    codeInputs.forEach(input => enteredCode += input.value);
    
    if (enteredCode.length !== 6) {
        showMessage(messageDiv, '✗ Please enter the complete 6-digit code!', 'error');
        return;
    }
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    button.disabled = true;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, code: enteredCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, '✓ Email verified successfully!', 'success');
            setTimeout(() => {
                document.getElementById('code-step').style.display = 'none';
                document.getElementById('contact-step').style.display = 'block';
                document.getElementById('verified-email').textContent = userEmail;
                hideMessage(messageDiv);
                clearResendTimer();
            }, 1500);
        } else {
            showMessage(messageDiv, '✗ ' + data.message, 'error');
            clearCodeInputs();
            codeInputs[0].focus();
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(messageDiv, '✗ Failed to verify code. Please try again.', 'error');
    } finally {
        button.innerHTML = '<i class="fas fa-check"></i> Verify Code';
        button.disabled = false;
    }
});

// Resend code (via Backend)
document.getElementById('resendBtn').addEventListener('click', async function() {
    const messageDiv = document.getElementById('form-message');
    const button = this;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    button.disabled = true;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/send-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, '✓ New code sent! Check your email.', 'success');
            clearCodeInputs();
            codeInputs[0].focus();
            startResendTimer();
        } else {
            showMessage(messageDiv, '✗ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(messageDiv, '✗ Failed to resend code. Please try again.', 'error');
    } finally {
        button.innerHTML = '<i class="fas fa-redo"></i> Resend Code';
    }
});

// Timer functions
function startResendTimer() {
    let timeLeft = 60;
    const resendBtn = document.getElementById('resendBtn');
    const timerText = document.getElementById('timer-text');
    
    resendBtn.disabled = true;
    resendTimer = setInterval(() => {
        timeLeft--;
        timerText.textContent = `⏱️ Request new code in ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearResendTimer();
            resendBtn.disabled = false;
            timerText.textContent = '';
        }
    }, 1000);
}

function clearResendTimer() {
    if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
    }
    const timerText = document.getElementById('timer-text');
    if (timerText) timerText.textContent = '';
}

function clearCodeInputs() {
    codeInputs.forEach(input => input.value = '');
}

// ========================
// CONTACT FORM (via Backend)
// ========================
document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const button = this.querySelector('button');
    const messageDiv = document.getElementById('form-message');
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    button.disabled = true;
    hideMessage(messageDiv);
    
    const formData = {
        name: this.querySelector('[name="from_name"]').value,
        email: userEmail,
        message: this.querySelector('[name="message"]').value
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/send-contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(messageDiv, '✓ Message sent successfully! We will reply to ' + userEmail, 'success');
            document.getElementById('contact-form').reset();
        } else {
            showMessage(messageDiv, '✗ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(messageDiv, '✗ Failed to send message. Please try again.', 'error');
    } finally {
        button.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        button.disabled = false;
    }
});

// Helper functions for messages
function showMessage(div, text, type) {
    div.textContent = text;
    div.className = `form-message ${type}`;
    div.style.display = 'block';
}

function hideMessage(div) {
    div.textContent = '';
    div.style.display = 'none';
}

// ========================
// PARTICLES ANIMATION
// ========================
const particlesContainer = document.getElementById('particles');
for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.width = Math.random() * 5 + 2 + 'px';
    particle.style.height = particle.style.width;
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particlesContainer.appendChild(particle);
}

// ========================
// SMOOTH SCROLL
// ========================
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ========================
// ACTIVE NAV LINK
// ========================
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// ========================
// SKILL BARS ANIMATION
// ========================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const progressBars = entry.target.querySelectorAll('.progress');
            progressBars.forEach(bar => {
                bar.style.width = bar.getAttribute('data-progress') + '%';
            });
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.skill-category').forEach(category => {
    observer.observe(category);
});

// ========================
// LOGIN MODAL
// ========================
const modal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const closeBtn = document.querySelector('.close');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

loginBtn.onclick = () => modal.style.display = 'block';
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target == modal) modal.style.display = 'none';
};

// ========================
// TAB SWITCHING
// ========================
const tabButtons = document.querySelectorAll('.tab-btn');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        tabButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const tab = this.getAttribute('data-tab');
        if (tab === 'login') {
            loginForm.style.display = 'flex';
            signupForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'flex';
        }
        document.getElementById('auth-message').textContent = '';
    });
});

// ========================
// AUTH STATE OBSERVER
// ========================
auth.onAuthStateChanged(user => {
    if (user) {
        window.location.href = 'maintenance.html';
    } else {
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
    }
});

// ========================
// LOGIN FUNCTION
// ========================
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const messageDiv = document.getElementById('auth-message');
    const button = this.querySelector('.auth-btn');
    
    button.textContent = 'Logging in...';
    button.disabled = true;
    messageDiv.textContent = '';
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            messageDiv.textContent = '✓ Login successful! Redirecting...';
            messageDiv.className = 'auth-message success';
            this.reset();
        })
        .catch((error) => {
            messageDiv.textContent = '✗ ' + error.message;
            messageDiv.className = 'auth-message error';
        })
        .finally(() => {
            button.textContent = 'Login';
            button.disabled = false;
        });
});

// ========================
// SIGNUP FUNCTION
// ========================
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const messageDiv = document.getElementById('auth-message');
    const button = this.querySelector('.auth-btn');
    
    button.textContent = 'Creating account...';
    button.disabled = true;
    messageDiv.textContent = '';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            messageDiv.textContent = '✓ Account created successfully! Redirecting...';
            messageDiv.className = 'auth-message success';
            this.reset();
        })
        .catch((error) => {
            messageDiv.textContent = '✗ ' + error.message;
            messageDiv.className = 'auth-message error';
        })
        .finally(() => {
            button.textContent = 'Sign Up';
            button.disabled = false;
        });
});

// ========================
// GOOGLE LOGIN
// ========================
const googleProvider = new firebase.auth.GoogleAuthProvider();

document.getElementById('googleLogin').addEventListener('click', function() {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.textContent = '';
    
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            messageDiv.textContent = '✓ Logged in with Google! Redirecting...';
            messageDiv.className = 'auth-message success';
        })
        .catch((error) => {
            messageDiv.textContent = '✗ ' + error.message;
            messageDiv.className = 'auth-message error';
        });
});

document.getElementById('googleSignup').addEventListener('click', function() {
    const messageDiv = document.getElementById('auth-message');
    messageDiv.textContent = '';
    
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            messageDiv.textContent = '✓ Account created with Google! Redirecting...';
            messageDiv.className = 'auth-message success';
        })
        .catch((error) => {
            messageDiv.textContent = '✗ ' + error.message;
            messageDiv.className = 'auth-message error';
        });
});

// ========================
// LOGOUT
// ========================
logoutBtn.addEventListener('click', function() {
    auth.signOut().then(() => {
        console.log('User signed out');
    }).catch((error) => {
        console.error('Logout error:', error);
    });
});