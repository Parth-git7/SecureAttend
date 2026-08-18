/**
 * SecureAttend - Login Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // If user is already logged in, redirect them to their dashboard
    const currentUser = window.Auth.getCurrentUser();
    if (currentUser && localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = window.Auth.getDashboardUrl(currentUser.role);
        return;
    }

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const messageEl = document.getElementById("loginMessage");

    // Demo Fill Buttons
    const demoStudentBtn = document.getElementById("demoStudentBtn");
    const demoTeacherBtn = document.getElementById("demoTeacherBtn");
    const demoAdminBtn = document.getElementById("demoAdminBtn");

    if (demoStudentBtn) {
        demoStudentBtn.addEventListener("click", () => {
            emailInput.value = "rahul.101@chitkara.edu.in";
            passwordInput.value = "password123";
            hideMessage();
        });
    }

    if (demoTeacherBtn) {
        demoTeacherBtn.addEventListener("click", () => {
            emailInput.value = "sharma.t101@chitkara.edu.in";
            passwordInput.value = "password123";
            hideMessage();
        });
    }

    if (demoAdminBtn) {
        demoAdminBtn.addEventListener("click", () => {
            emailInput.value = "admin@chitkara.edu.in";
            passwordInput.value = "password123";
            hideMessage();
        });
    }

    // Form submission
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Please enter both email and password.", "error");
            return;
        }

        const result = window.Auth.login(email, password);

        if (!result.success) {
            showMessage(result.message, "error");
            return;
        }

        showMessage(`Welcome back, ${result.user.name}! Redirecting...`, "success");

        setTimeout(() => {
            window.location.href = result.redirectUrl;
        }, 600);
    });

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = `message show ${type}`;
    }

    function hideMessage() {
        messageEl.textContent = "";
        messageEl.className = "message";
    }
});