/**
 * Creates a new user account by sending email, confirmEmail, and password to the server.
 * Stores the partial token in localStorage for 2FA setup if account creation succeeds.
 * Displays appropriate error messages if validation or server errors occur.
 */
async function createAccount() {
  const email = document.getElementById('email').value.trim();
  const confirmEmail = document.getElementById('confirmEmail').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorDiv = document.getElementById('error');

  if (!email || !confirmEmail || !password) {
    errorDiv.textContent = "Please enter all fields.";
    return;
  }

  try {
    const res = await fetch('/api/auth/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, confirmEmail, password })
    });

    let data;
    try {
      data = await res.json();
    } catch {
      errorDiv.textContent = "Server response not valid JSON.";
      return;
    }

    if (res.ok && data.token) {
      localStorage.setItem('partialToken', data.token);
      window.location.href = '/2fa-setup.html';
    } else if (res.status === 403 && data.requestLink) {
      errorDiv.innerHTML = `${data.message} <a href="${data.requestLink}" style="color: #00c853;">Request access</a>`;
    } else {
      errorDiv.textContent = data.message || "Failed to create account.";
    }

  } catch {
    errorDiv.textContent = "Server error. Try again later.";
  }
}
