const loggedIn =
    localStorage.getItem("isLoggedIn");
    
if (loggedIn !== "true") {
    window.location.href = "login.html";
}

const user =
    JSON.parse(localStorage.getItem("secureAttendUser"));
    
if (user !== null) {
    document.getElementById("studentName").textContent = user.name;
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileRoll").textContent = user.rollNo;
    document.getElementById("profileEmail").textContent = user.email;
}
document
    .getElementById("logoutButton")
    .addEventListener("click", function() {
        localStorage.removeItem("isLoggedIn");
        window.location.href = "login.html";
    });