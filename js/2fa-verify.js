const partialToken = localStorage.getItem("partialToken");
const authToken = localStorage.getItem("authToken");
const errorDiv = document.getElementById("error");
const verifyBtn = document.getElementById("verifyBtn");
const codeInput = document.getElementById("code");

/**
 * Clears stored tokens and redirects the user to the login page.
 */
function redirectToLogin() {
  localStorage.removeItem("partialToken");
  localStorage.removeItem("authToken");
  window.location.href = "/login.html";
}

if (authToken) {
  window.location.href = "/index.html";
}

if (!partialToken) {
  redirectToLogin();
}

/**
 * Verifies the partial token with the server.
 * Enables the verification button if the token is valid.
 */
async function verifyPartialToken() {
  try {
    const res = await fetch("/api/auth/verify", {
      method: "GET",
      headers: { "Authorization": "Bearer " + partialToken }
    });
    const data = await res.json();

    if (!res.ok || !data.valid) {
      redirectToLogin();
      return;
    }

    verifyBtn.disabled = false;
  } catch {
    redirectToLogin();
  }
}

verifyPartialToken();

/**
 * Verifies the 2FA code entered by the user.
 * If valid, stores the full authentication token and redirects to the dashboard.
 */
async function verify2FA() {
  const code = codeInput.value.trim();

  if (!partialToken) {
    errorDiv.innerText = "Missing session. Please log in again.";
    redirectToLogin();
    return;
  }

  if (!code) {
    errorDiv.innerText = "Please enter the 2FA code.";
    return;
  }

  try {
    const res = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: partialToken, code })
    });
    const data = await res.json();

    if (data.token) {
      localStorage.setItem("authToken", data.token);
      localStorage.removeItem("partialToken");
      window.location.href = "/index.html";
    } else {
      errorDiv.innerText = data.message || "Invalid code";
    }
  } catch {
    errorDiv.innerText = "Server error. Try again later.";
  }
}

if (verifyBtn) {
  verifyBtn.addEventListener("click", verify2FA);
}

if (codeInput) {
  codeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      verifyBtn.click();
    }
  });
}