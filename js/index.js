/**
 * Logs out the user by clearing localStorage, sessionStorage, and cookies,
 * then redirects to the login page.
 */
function logout() {
  localStorage.clear();
  sessionStorage.clear();

  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax";
  });

  window.location.href = '/login.html';
}

/**
 * Verifies user session on page load by checking the auth token.
 * Redirects to login if session is invalid.
 */
(async function enforceSession() {
  const authToken = localStorage.getItem('authToken');
  if (!authToken) return window.location.href = '/login.html';

  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });

    if (!res.ok) {
      localStorage.removeItem('authToken');
      window.location.href = '/login.html';
    }
  } catch {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
  }
})();

/**
 * Extracts the email from the JWT stored in localStorage.
 * @returns {string|null} The email if the token exists and is valid, otherwise null.
 */
function getEmailFromToken() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email;  // <-- updated from username to email
  } catch (err) {
    console.error('Failed to decode JWT', err);
    return null;
  }
}

let userScrolledUp = false;
