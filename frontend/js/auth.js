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
    if(type === 'error') icon = 'fa-circle-xmark';
    if(type === 'success') icon = 'fa-circle-check';
    
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
                showToast("Error logging in: " + error.message, "error");
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

});
