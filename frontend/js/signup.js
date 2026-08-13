const signupForm = document.getElementById("signupForm");

const message = document.getElementById("signupMessage");


signupForm.addEventListener("submit", function(event) {

    event.preventDefault();


    const name = document.getElementById("name").value.trim();

    const rollNo = document.getElementById("rollNo").value.trim();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;


    if (
        name === "" ||
        rollNo === "" ||
        email === "" ||
        password === "" ||
        confirmPassword === ""
    ) {

        showMessage("Please fill in all fields.", "error");

        return;
    }


    if (password !== confirmPassword) {

        showMessage("Passwords do not match.", "error");

        return;
    }


    const existingUser =
        JSON.parse(localStorage.getItem("secureAttendUser"));

    if (
        existingUser !== null &&
        (
            existingUser.email === email ||
            existingUser.rollNo === rollNo
        )
    ) {

        showMessage(
            "An account with this email or roll number already exists.",
            "error"
        );

        return;
    }


    const user = {

        name: name,

        rollNo: rollNo,

        email: email,

        password: password

    };


    localStorage.setItem(
        "secureAttendUser",
        JSON.stringify(user)
    );
    console.log(
        localStorage.getItem("secureAttendUser")
    );

    showMessage(
        "Account created successfully! Redirecting...",
        "success"
    );


    setTimeout(function() {

        window.location.href = "login.html";

    }, 1000);

});


function showMessage(text, type) {

    message.textContent = text;

    message.className = "message " + type;
}