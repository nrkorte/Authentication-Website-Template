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
 * Initializes the 2FA setup process.
 * Verifies the partial token with the server and fetches the QR code for TOTP setup.
 */
async function init2FASetup() {
  try {
    const verifyRes = await fetch("/api/auth/verify", {
      method: "GET",
      headers: { "Authorization": "Bearer " + partialToken }
    });
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.valid) {
      redirectToLogin();
      return;
    }

    const setupRes = await fetch("/api/2fa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: partialToken })
    });
    const setupData = await setupRes.json();

    if (setupData.qrCode) {
      document.getElementById("qr").src = setupData.qrCode;
    } else {
      errorDiv.innerText = "Error generating QR code";
    }

  } catch {
    redirectToLogin();
  }
}

init2FASetup();

/**
 * Verifies the 2FA code entered by the user.
 * If valid, stores the full authentication token and redirects to the dashboard.
 */
async function verify2FA() {
  const code = codeInput.value;

  if (!partialToken) {
    errorDiv.innerText = "Missing session. Please log in again.";
    redirectToLogin();
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
    errorDiv.innerText = "Server error.";
  }
}

if (codeInput) {
  codeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      verifyBtn.click();
    }
  });
}
