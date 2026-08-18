/**
 * SecureAttend - Student Dashboard Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // Role Guard
    const user = window.Auth.requireAuth(["student"]);
    if (!user) return;

    // DOM Elements - Profile & Navbar
    document.getElementById("navUserName").textContent = user.name;
    document.getElementById("navUserRoll").textContent = `Roll No. ${user.rollNo || '—'}`;
    document.getElementById("studentGreetingName").textContent = user.name.split(" ")[0];
    document.getElementById("userAvatar").textContent = user.name.charAt(0).toUpperCase();
    document.getElementById("studentGroupDisplay").textContent = user.groupId || "G1";
    document.getElementById("faceStatusDisplay").textContent = user.faceTemplate ? "✓ Registered" : "⚠️ Pending";

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        window.Auth.logout();
    });

    // Render Attendance History
    renderAttendanceHistory();

    // ==========================================
    // ROOM JOIN & 3-FACTOR VERIFICATION
    // ==========================================
    const joinSessionForm = document.getElementById("joinSessionForm");
    const roomCodeInput = document.getElementById("roomCodeInput");
    const joinMessage = document.getElementById("joinMessage");
    const verificationResultBox = document.getElementById("verificationResultBox");

    // Modal Elements
    const verificationModal = document.getElementById("verificationModal");
    const closeVerificationModalBtn = document.getElementById("closeVerificationModalBtn");
    const gpsStatusPill = document.getElementById("gpsStatusPill");
    const gpsDetailsText = document.getElementById("gpsDetailsText");
    const faceMatchPill = document.getElementById("faceMatchPill");
    const livenessPrompt = document.getElementById("livenessPrompt");
    const verifyVideo = document.getElementById("verifyVideo");
    const verifyCanvas = document.getElementById("verifyCanvas");
    const confirmVerificationBtn = document.getElementById("confirmVerificationBtn");
    const simulateGpsFailureBtn = document.getElementById("simulateGpsFailureBtn");
    const modalVerificationMsg = document.getElementById("modalVerificationMsg");

    let activeCameraStream = null;
    let currentTargetRoomCode = "";
    let forceGpsFailure = false;

    // Auto-uppercase room code input
    roomCodeInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.toUpperCase();
    });

    joinSessionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const code = roomCodeInput.value.trim().toUpperCase();

        if (code.length < 5) {
            showMsg(joinMessage, "Please enter a valid 5-character room code.", "error");
            return;
        }

        // Check if room exists and is active
        const sessions = window.DataStore.getActiveSessions();
        const session = sessions[code];

        if (!session) {
            showMsg(joinMessage, `Room code "${code}" not found. Ask your teacher for the active room code.`, "error");
            return;
        }

        if (!session.isActive) {
            showMsg(joinMessage, "This session has already ended.", "error");
            return;
        }

        // Check if student belongs to this group's master roster
        if (!session.roster[user.rollNo]) {
            showMsg(joinMessage, `Access Denied: You are not in the master roster for Group ${session.groupId} (${session.subject}).`, "error");
            return;
        }

        // Valid room found! Open verification modal
        currentTargetRoomCode = code;
        forceGpsFailure = false;
        openVerificationModal(session);
    });

    async function openVerificationModal(session) {
        verificationModal.classList.add("open");
        joinMessage.className = "message"; // clear

        // 1. Simulate / Compute GPS Distance
        gpsStatusPill.className = "status-badge badge-present";
        gpsStatusPill.textContent = "✓ In Range (9m)";
        gpsDetailsText.innerHTML = `Connected to <strong>${session.location?.classroom || 'Classroom Beacon'}</strong>.<br>Distance: <strong>~9 meters</strong> (Allowed: &lt;50m).`;

        // 2. Start Camera for Face Match & Liveness
        faceMatchPill.className = "status-badge badge-review";
        faceMatchPill.textContent = "Scanning...";
        livenessPrompt.textContent = "Hold still, then blink to verify liveness";

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                activeCameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
                });
                verifyVideo.srcObject = activeCameraStream;
            }
        } catch (err) {
            console.log("Using simulated camera canvas fallback");
        }

        // Simulated Liveness recognition delay
        setTimeout(() => {
            faceMatchPill.className = "status-badge badge-present";
            faceMatchPill.textContent = "✓ Verified Match";
            livenessPrompt.textContent = "✓ Face matched with Master Roster template (99.4% confidence)";
        }, 1200);
    }

    function closeVerificationModal() {
        verificationModal.classList.remove("open");
        if (activeCameraStream) {
            activeCameraStream.getTracks().forEach(t => t.stop());
            activeCameraStream = null;
        }
    }

    closeVerificationModalBtn.addEventListener("click", closeVerificationModal);

    simulateGpsFailureBtn.addEventListener("click", () => {
        forceGpsFailure = !forceGpsFailure;
        if (forceGpsFailure) {
            gpsStatusPill.className = "status-badge badge-review";
            gpsStatusPill.textContent = "⚠️ GPS Weak (~180m)";
            gpsDetailsText.innerHTML = "Location accuracy is degraded (&gt;50m). Will trigger <strong>Teacher Review</strong> state.";
            simulateGpsFailureBtn.textContent = "Reset to Normal GPS";
        } else {
            gpsStatusPill.className = "status-badge badge-present";
            gpsStatusPill.textContent = "✓ In Range (9m)";
            gpsDetailsText.innerHTML = "Connected to classroom beacon. Distance: <strong>~9 meters</strong>.";
            simulateGpsFailureBtn.textContent = "Test GPS Low Confidence (Review)";
        }
    });

    confirmVerificationBtn.addEventListener("click", () => {
        const verificationPayload = {
            faceMatch: true,
            livenessPass: true,
            locationPass: !forceGpsFailure,
            distance: forceGpsFailure ? "180m (Out of range)" : "9m"
        };

        const result = window.DataStore.recordStudentVerification(
            currentTargetRoomCode,
            user,
            verificationPayload
        );

        closeVerificationModal();

        if (!result.success) {
            showMsg(joinMessage, result.message, "error");
            return;
        }

        // Display result banner on dashboard
        displayVerificationResult(result);

        // Refresh History
        renderAttendanceHistory();
    });

    function displayVerificationResult(result) {
        verificationResultBox.style.display = "block";
        const session = result.session;

        if (result.status === "PRESENT") {
            verificationResultBox.innerHTML = `
                <div class="result-banner present">
                    <div style="font-size: 38px; margin-bottom: 6px;">🎉</div>
                    <h3>Attendance Verified · PRESENT</h3>
                    <p style="font-size: 14px; margin-bottom: 10px;">
                        You have been successfully marked <strong>PRESENT</strong> for <strong>${session.subject}</strong> (${session.groupId}).
                    </p>
                    <div style="font-size: 12px; color: #065f46; display: flex; justify-content: center; gap: 16px;">
                        <span>Face Match: ✓ Passed</span>
                        <span>Liveness: ✓ Passed</span>
                        <span>Location: ✓ Classroom Verified</span>
                    </div>
                </div>
            `;
        } else if (result.status === "REVIEW") {
            verificationResultBox.innerHTML = `
                <div class="result-banner review">
                    <div style="font-size: 38px; margin-bottom: 6px;">⚠️</div>
                    <h3>Attendance Status · PENDING TEACHER REVIEW</h3>
                    <p style="font-size: 14px; margin-bottom: 10px;">
                        Biometrics matched, but GPS accuracy was low or out-of-range.
                        Your record was sent to <strong>${session.teacherName}</strong> for manual one-click approval.
                    </p>
                    <div style="font-size: 12px; color: #92400e;">
                        Status will automatically update on the teacher's screen.
                    </div>
                </div>
            `;
        } else {
            verificationResultBox.innerHTML = `
                <div class="result-banner rejected">
                    <div style="font-size: 38px; margin-bottom: 6px;">❌</div>
                    <h3>Verification Failed · REJECTED</h3>
                    <p style="font-size: 14px;">${result.message}</p>
                </div>
            `;
        }
    }

    // Render History table
    function renderAttendanceHistory() {
        const historyBody = document.getElementById("attendanceHistoryTableBody");
        const history = window.DataStore.getStudentAttendanceHistory(user.rollNo);

        // Update stats
        const total = history.length;
        const presentCount = history.filter(h => h.status === "PRESENT").length;
        const rate = total > 0 ? Math.round((presentCount / total) * 100) : 100;

        document.getElementById("attendanceRateDisplay").textContent = `${rate}%`;
        document.getElementById("classesCountDisplay").textContent = `${total} Total Sessions`;

        if (history.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                        No attendance history found. Join an active session above!
                    </td>
                </tr>
            `;
            return;
        }

        historyBody.innerHTML = history.map(item => {
            let badgeClass = "badge-absent";
            if (item.status === "PRESENT") badgeClass = "badge-present";
            else if (item.status === "REVIEW") badgeClass = "badge-review";

            return `
                <tr>
                    <td><strong>${escapeHtml(item.subject)}</strong></td>
                    <td><span class="role-badge student" style="font-size: 10px;">${escapeHtml(item.group || 'G1')}</span></td>
                    <td>${escapeHtml(item.teacherName || 'Faculty')}</td>
                    <td>${escapeHtml(item.date)} · ${escapeHtml(item.time)}</td>
                    <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${escapeHtml(item.roomCode)}</code></td>
                    <td>
                        <span class="status-badge ${badgeClass}">
                            ${item.status === "PRESENT" ? "✓ PRESENT" : item.status === "REVIEW" ? "⚠️ REVIEW" : "✗ ABSENT"}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function showMsg(el, text, type) {
        if (!el) return;
        el.textContent = text;
        el.className = `message show ${type}`;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});
