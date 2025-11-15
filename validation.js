// validation.js
document.addEventListener("DOMContentLoaded", () => {
  const errorEl = document.getElementById("error-message");

  const showError = (msg) => {
    if (errorEl) {
      errorEl.innerText = msg;
      errorEl.style.display = "block";
    } else {
      alert(msg);
    }
  };

  const clearError = () => {
    if (errorEl) {
      errorEl.innerText = "";
      errorEl.style.display = "none";
    }
  };

  const apiBase = "http://localhost:5000";

  // Detect page
  const isSignup = !!document.getElementById("firstname-input");
  const isLogin =
    !isSignup &&
    !!document.getElementById("password-input") &&
    document.querySelector("h1") &&
    document.querySelector("h1").innerText.trim().toLowerCase() === "login";

  if (isSignup) setupSignup();
  if (isLogin) setupLogin();

  // ------------- SIGNUP FLOW -------------
  function setupSignup() {
    const form = document.getElementById("form");
    const nameInput = document.getElementById("firstname-input");
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");
    const repeatPasswordInput = document.getElementById(
      "repeat-password-input"
    );

    const sendOtpBtn = document.getElementById("sendSignupOTPBtn");
    const otpSection = document.getElementById("signupOtpSection");
    const otpInput = document.getElementById("signupOTP");
    const verifyOtpBtn = document.getElementById("verifySignupOTPBtn");
    const otpStatus = document.getElementById("signup-otp-status");
    const signupBtn = document.getElementById("signupBtn");

    if (
      !form ||
      !nameInput ||
      !emailInput ||
      !sendOtpBtn ||
      !otpInput ||
      !verifyOtpBtn ||
      !signupBtn
    ) {
      console.warn("Signup elements missing.");
      return;
    }

    let emailVerified = false;

    // Disable password & signup until OTP verified
    if (passwordInput) {
      passwordInput.disabled = true;
      passwordInput.style.opacity = "0.6";
    }
    if (repeatPasswordInput) {
      repeatPasswordInput.disabled = true;
      repeatPasswordInput.style.opacity = "0.6";
    }
    signupBtn.disabled = true;

    // SEND OTP (SIGNUP)
    sendOtpBtn.addEventListener("click", async () => {
      clearError();
      otpStatus.innerText = "";

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();

      if (!name) return showError("Please enter your name first.");
      if (!email || !validateEmail(email))
        return showError("Please enter a valid email.");

      try {
        const res = await fetch(`${apiBase}/api/verify/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        otpSection.style.display = "block";
        otpStatus.style.color = "#2E2B41";
        otpStatus.innerText = data.message || "OTP sent. Check your email.";
      } catch (err) {
        console.error(err);
        showError("Error sending OTP. Please try again.");
      }
    });

    // VERIFY OTP (SIGNUP)
    verifyOtpBtn.addEventListener("click", async () => {
      clearError();
      const email = emailInput.value.trim();
      const otp = otpInput.value.trim();

      if (!otp) return showError("Please enter the OTP.");

      try {
        const res = await fetch(`${apiBase}/api/verify/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();
        if (
          data.message &&
          (data.message.includes("Email Verified Successfully") ||
            data.message.includes("User Verified Successfully"))
        ) {
          emailVerified = true;
          otpStatus.style.color = "green";
          otpStatus.innerText = "Email verified ✅ Now set your password.";

          // Enable password fields + signup
          if (passwordInput) {
            passwordInput.disabled = false;
            passwordInput.style.opacity = "1";
          }
          if (repeatPasswordInput) {
            repeatPasswordInput.disabled = false;
            repeatPasswordInput.style.opacity = "1";
          }
          signupBtn.disabled = false;
          verifyOtpBtn.disabled = true;
        } else {
          otpStatus.style.color = "#f06272";
          otpStatus.innerText = data.message || "Invalid or expired OTP.";
        }
      } catch (err) {
        console.error(err);
        showError("Error verifying OTP. Please try again.");
      }
    });

    // FINAL SIGNUP SUBMIT
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      if (!emailVerified) {
        return showError("Please verify your email with OTP before signup.");
      }

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput ? passwordInput.value : "";
      const repeatPassword = repeatPasswordInput
        ? repeatPasswordInput.value
        : "";

      if (!password || password.length < 8)
        return showError("Password must be at least 8 characters.");
      if (password !== repeatPassword)
        return showError("Passwords do not match.");

      try {
        const res = await fetch(`${apiBase}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (data.message && data.message.includes("Registration Successful")) {
          if (data.userId) {
            localStorage.setItem("userId", data.userId);
          }
          alert("Signup successful! Redirecting...");
          window.location.href = "main.html";
        } else {
          showError(data.message || "Registration failed.");
        }
      } catch (err) {
        console.error(err);
        showError("Server error during registration.");
      }
    });
  }

  // ------------- LOGIN FLOW -------------
  function setupLogin() {
    const form = document.getElementById("form");
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    const sendOtpBtn = document.getElementById("sendLoginOTPBtn");
    const otpSection = document.getElementById("loginOtpSection");
    const otpInput = document.getElementById("loginOTP");
    const verifyOtpBtn = document.getElementById("verifyLoginOTPBtn");
    const otpStatus = document.getElementById("login-otp-status");
    const loginBtn = document.getElementById("loginBtn");

    if (
      !form ||
      !emailInput ||
      !passwordInput ||
      !sendOtpBtn ||
      !otpInput ||
      !verifyOtpBtn ||
      !loginBtn
    ) {
      console.warn("Login elements missing.");
      return;
    }

    let otpVerified = false;
    loginBtn.disabled = true;

    // SEND OTP (LOGIN)
    sendOtpBtn.addEventListener("click", async () => {
      clearError();
      otpStatus.innerText = "";

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !validateEmail(email))
        return showError("Please enter a valid email first.");
      if (!password)
        return showError("Please enter your password before requesting OTP.");

      try {
        const res = await fetch(`${apiBase}/api/verify/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        otpSection.style.display = "block";
        otpStatus.style.color = "#2E2B41";
        otpStatus.innerText = data.message || "OTP sent. Check your email.";
      } catch (err) {
        console.error(err);
        showError("Error sending OTP.");
      }
    });

    // VERIFY OTP (LOGIN)
    verifyOtpBtn.addEventListener("click", async () => {
      clearError();
      const email = emailInput.value.trim();
      const otp = otpInput.value.trim();

      if (!otp) return showError("Please enter the OTP.");

      try {
        const res = await fetch(`${apiBase}/api/verify/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();
        if (
          data.message &&
          (data.message.includes("Email Verified Successfully") ||
            data.message.includes("User Verified Successfully"))
        ) {
          otpVerified = true;
          otpStatus.style.color = "green";
          otpStatus.innerText = "OTP verified ✅ You can now login.";
          loginBtn.disabled = false;
          verifyOtpBtn.disabled = true;
        } else {
          otpStatus.style.color = "#f06272";
          otpStatus.innerText = data.message || "Invalid or expired OTP.";
        }
      } catch (err) {
        console.error(err);
        showError("Error verifying OTP.");
      }
    });

    // FINAL LOGIN SUBMIT
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      if (!otpVerified) {
        return showError("Please verify OTP before logging in.");
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !validateEmail(email))
        return showError("Enter a valid email.");
      if (!password) return showError("Enter your password.");

      try {
        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        const msg = data.message || "";

        if (msg.includes("Login Successful")) {
          if (data.userId) {
            localStorage.setItem("userId", data.userId);
          }
          alert("Login successful! Redirecting...");
          window.location.href = "main.html";
        } else if (msg.includes("Incorrect Password")) {
          showError("Incorrect password ❌");
        } else if (msg.includes("User Not Found")) {
          showError("No account found with this email.");
        } else if (msg.includes("verify your email")) {
          showError(msg);
        } else {
          showError(msg || "Login failed.");
        }
      } catch (err) {
        console.error(err);
        showError("Server error during login.");
      }
    });
  }

  // ------------- HELPERS -------------
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});
