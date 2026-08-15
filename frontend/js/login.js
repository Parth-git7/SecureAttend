const loginForm = document.getElementById("loginForm");

const message = document.getElementById("loginMessage");


loginForm.addEventListener("submit", function(event) {

    event.preventDefault();


    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    if (email === "" || password === "") {

        showMessage("Please enter your email and Password.", "error");

        return;
    }


    const storedUser =
        JSON.parse(localStorage.getItem("secureAttendUser"));

    if (storedUser === null) {
        showMessage(
            "No account found. Please create an account first.",
            "error"
        );
        return;
    }

    if (
        email !== storedUser.email ||
        password !== storedUser.password
    ) {
        showMessage(
            "Invalid email or password.",
            "error"
        );

        return;
    }

    localStorage.setItem(
        "isLoggedIn",
        "true"
    );

    window.location.href = "dashboard.html";

});


function showMessage(text, type) {

    message.textContent = text;

    message.className = "message " + type;
}