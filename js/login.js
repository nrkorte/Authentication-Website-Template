/**
 * Initializes the login page.
 * Clears any leftover partial login sessions if no full auth token exists.
 * Redirects to index if the user is already fully authenticated.
 */
(async function initLoginPage() {
  try {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      localStorage.removeItem('partialToken');
    } else {
      window.location.href = '/index.html';
      return;
    }
  } catch {
    // Fail silently; partial token removal is non-critical
  }
})();

/**
 * Handles user login by sending credentials to the server.
 * Stores a partial token in localStorage for 2FA if login succeeds.
 * Redirects the user based on server instructions.
 */
async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorDiv = document.getElementById('error');

  if (!email || !password) {
    errorDiv.textContent = "Please enter both fields.";
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    let data;
    try {
      data = await res.json();
    } catch {
      errorDiv.textContent = "Server response not valid JSON.";
      return;
    }

    if (res.ok) {
      localStorage.setItem('partialToken', data.token);

      switch(data.next) {
        case 'setup-2fa':
          window.location.href = '/2fa-setup.html';
          break;
        case 'verify-2fa':
          window.location.href = '/2fa-verify.html';
          break;
        default:
          window.location.href = '/index.html';
      }
    } else {
      errorDiv.textContent = data.message || "Invalid login.";
    }
  } catch {
    errorDiv.textContent = "Server error. Try again later.";
  }
}
