const supabaseUrl = 'https://slyauawczwwvhxgevuau.supabase.co';
const supabaseKey = 'sb_publishable_4wJshA4WLgov6UTJ8_rBCw_vQBUIDFS';

// Global Toast function
window.showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-circle-info';
    if (type === 'error') icon = 'fa-circle-xmark';
    if (type === 'success') icon = 'fa-circle-check';

    toast.innerHTML = `<i class="fa-solid ${icon}" style="font-size:1.25rem;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.15s ease forwards';
        setTimeout(() => toast.remove(), 150);
    }, 1500);
};

try {
    window.Supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase Auth initialized successfully.");
} catch (e) {
    console.error("Failed to initialize Supabase:", e);
}

// Setup event listeners for forms
document.addEventListener("DOMContentLoaded", () => {

    // Login Form Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button[type="submit"]');

            const originalText = btn.innerText;
            btn.innerText = "Signing in...";
            btn.disabled = true;

            try {
                const { data, error } = await Supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                showToast("Login successful!", "success");
                setTimeout(() => { window.location.href = "dashboard.html"; }, 300); // Redirect after toast
            } catch (error) {
                // Clear any existing banners
                const existingBanner = document.getElementById('verification-banner');
                if (existingBanner) existingBanner.remove();

                if (error.message.includes('Email not confirmed')) {
                    const banner = document.createElement('div');
                    banner.id = 'verification-banner';
                    banner.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                    banner.style.border = '1px solid rgba(239, 68, 68, 0.4)';
                    banner.style.color = 'var(--text-main)';
                    banner.style.padding = '1rem 1.5rem';
                    banner.style.borderRadius = '0.5rem';
                    banner.style.marginBottom = '1.5rem';
                    banner.style.display = 'flex';
                    banner.style.alignItems = 'center';
                    banner.style.gap = '1rem';
                    banner.style.fontSize = '0.9rem';
                    banner.style.textAlign = 'left';
                    banner.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444; font-size: 1.25rem;"></i> <div><strong>Action Required:</strong> Your email address has not been verified. Please check your inbox.</div>`;

                    loginForm.insertBefore(banner, loginForm.firstChild);
                } else {
                    showToast("Error logging in: " + error.message, "error");
                }
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Signup Form Logic
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const fullName = document.getElementById('fullName').value;
            const btn = signupForm.querySelector('button[type="submit"]');

            const originalText = btn.innerText;
            btn.innerText = "Creating Account...";
            btn.disabled = true;

            try {
                const { data, error } = await Supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                });

                if (error) throw error;

                // Show success and redirect
                showToast("Signup successful! You can now log in.", "success");
                setTimeout(() => { window.location.href = "login.html"; }, 500);
            } catch (error) {
                showToast("Error signing up: " + error.message, "error");
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Google Auth Logic
    const googleBtn = document.getElementById('googleAuthBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const originalText = googleBtn.innerHTML;
            googleBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Connecting...`;
            googleBtn.disabled = true;
            
            try {
                const { data, error } = await Supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/dashboard.html'
                    }
                });
                if (error) throw error;
            } catch (error) {
                showToast("Error with Google sign in: " + error.message, "error");
                googleBtn.innerHTML = originalText;
                googleBtn.disabled = false;
            }
        });
    }

});
