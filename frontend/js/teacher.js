/**
 * SecureAttend - Teacher Dashboard Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // Role Guard
    const user = window.Auth.requireAuth(["teacher"]);
    if (!user) return;

    // DOM Elements - Profile & Navbar
    document.getElementById("navTeacherName").textContent = user.name;
    document.getElementById("navTeacherId").textContent = `ID: ${user.teacherId || 'T101'}`;
    document.getElementById("userAvatar").textContent = user.name.charAt(0).toUpperCase();

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        window.Auth.logout();
    });

    // Populate Groups & Subjects
    const selectGroup = document.getElementById("selectGroup");
    const selectSubject = document.getElementById("selectSubject");

    const groups = window.DataStore.getGroups();
    const subjects = window.DataStore.getSubjects();

    selectGroup.innerHTML = groups.map(g => `<option value="${g.id}">${g.name} (${g.semester})</option>`).join("");
    selectSubject.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join("");

    // State
    let activeSession = null;
    let timerInterval = null;
    let pollingInterval = null;

    // UI Containers
    const sessionSetupCard = document.getElementById("sessionSetupCard");
    const activeSessionContainer = document.getElementById("activeSessionContainer");
    const startSessionForm = document.getElementById("startSessionForm");
    const startSessionMessage = document.getElementById("startSessionMessage");
    const globalSessionStatus = document.getElementById("globalSessionStatus");

    // Check for existing active session by this teacher
    checkActiveSession();

    function checkActiveSession() {
        const sessions = window.DataStore.getActiveSessions();
        const teacherId = user.teacherId || user.id;

        // Find any active session for this teacher
        const existingSession = Object.values(sessions).find(
            s => (s.teacherId === teacherId || s.teacherName === user.name) && s.isActive
        );

        if (existingSession) {
            activeSession = existingSession;
            renderActiveSessionView();
        } else {
            renderSetupView();
        }
    }

    // Start Session Form Submit
    startSessionForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const groupId = selectGroup.value;
        const subject = selectSubject.value;
        const locationText = document.getElementById("classroomLocation").value;

        const session = window.DataStore.createAttendanceSession(
            user,
            groupId,
            subject,
            { classroom: locationText, latitude: 30.5165, longitude: 76.6592 }
        );

        activeSession = session;
        renderActiveSessionView();
    });

    function renderSetupView() {
        sessionSetupCard.style.display = "block";
        activeSessionContainer.style.display = "none";
        globalSessionStatus.textContent = "No Active Session";
        if (timerInterval) clearInterval(timerInterval);
        if (pollingInterval) clearInterval(pollingInterval);
    }

    function renderActiveSessionView() {
        sessionSetupCard.style.display = "none";
        activeSessionContainer.style.display = "block";
        globalSessionStatus.textContent = `Room ${activeSession.roomCode} Active`;

        document.getElementById("activeSessionSubject").textContent = activeSession.subject;
        document.getElementById("activeSessionMeta").textContent = `Group ${activeSession.groupId} · ${activeSession.location?.classroom || 'Classroom Beacon'}`;
        document.getElementById("activeRoomCodeText").textContent = activeSession.roomCode;
        document.getElementById("rosterTableTitle").textContent = `Group ${activeSession.groupId} Master Roster (${activeSession.subject})`;

        // Start Countdown Timer
        startCountdownTimer();

        // Render Roster & Stats
        renderRosterAndStats();

        // Poll for student updates every 2 seconds
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = setInterval(() => {
            const sessions = window.DataStore.getActiveSessions();
            if (sessions[activeSession.roomCode]) {
                activeSession = sessions[activeSession.roomCode];
                renderRosterAndStats();
            }
        }, 1500);
    }

    function startCountdownTimer() {
        if (timerInterval) clearInterval(timerInterval);

        function updateTimer() {
            const expiryTime = new Date(activeSession.expiresAt).getTime();
            const now = Date.now();
            const diff = expiryTime - now;

            if (diff <= 0) {
                document.getElementById("countdownTimer").textContent = "⚠️ Room Code Expired";
                clearInterval(timerInterval);
                return;
            }

            const minutes = Math.floor(diff / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            document.getElementById("countdownTimer").textContent = `⏳ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} remaining`;
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // Render Master Roster and Summary Statistics
    function renderRosterAndStats() {
        const roster = Object.values(activeSession.roster || {});
        const total = roster.length;
        const presentCount = roster.filter(s => s.status === "PRESENT").length;
        const absentCount = roster.filter(s => s.status === "ABSENT").length;
        const reviewCount = roster.filter(s => s.status === "REVIEW").length;
        const percent = total > 0 ? Math.round((presentCount / total) * 100) : 0;

        document.getElementById("statTotalStudents").textContent = total;
        document.getElementById("statPresentStudents").textContent = presentCount;
        document.getElementById("statAbsentStudents").textContent = absentCount;
        document.getElementById("statReviewStudents").textContent = reviewCount;
        document.getElementById("statPresentPercent").textContent = `${percent}% Present`;

        // Filter by search query if any
        const searchQuery = (document.getElementById("rosterSearchInput").value || "").toLowerCase().trim();
        const filteredRoster = roster.filter(student =>
            student.rollNo.toLowerCase().includes(searchQuery) ||
            student.name.toLowerCase().includes(searchQuery) ||
            student.email.toLowerCase().includes(searchQuery)
        );

        const tableBody = document.getElementById("rosterTableBody");

        if (filteredRoster.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 25px;">
                        No students match the search criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filteredRoster.map(student => {
            let badgeClass = "badge-absent";
            let badgeText = "✗ ABSENT";
            if (student.status === "PRESENT") {
                badgeClass = "badge-present";
                badgeText = "✓ PRESENT";
            } else if (student.status === "REVIEW") {
                badgeClass = "badge-review";
                badgeText = "⚠️ REVIEW";
            }

            let verificationText = "—";
            if (student.joinedAt) {
                const time = new Date(student.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                verificationText = `${student.verificationMode || 'Biometric'} · ${time}`;
                if (student.distance) verificationText += ` (${student.distance})`;
            }

            return `
                <tr>
                    <td><strong>${escapeHtml(student.rollNo)}</strong></td>
                    <td>${escapeHtml(student.name)}</td>
                    <td><span style="color: var(--text-muted); font-size: 13px;">${escapeHtml(student.email)}</span></td>
                    <td>
                        <span class="status-badge ${badgeClass}">
                            ${badgeText}
                        </span>
                    </td>
                    <td><span style="font-size: 12px; color: var(--text-muted);">${escapeHtml(verificationText)}</span></td>
                    <td>
                        <div class="action-btn-group">
                            <button type="button" class="icon-btn btn-approve" onclick="overrideStatus('${student.rollNo}', 'PRESENT')" title="Mark Present">
                                ✓ Present
                            </button>
                            <button type="button" class="icon-btn btn-review" onclick="overrideStatus('${student.rollNo}', 'REVIEW')" title="Mark Review">
                                ⚠️ Review
                            </button>
                            <button type="button" class="icon-btn btn-absent" onclick="overrideStatus('${student.rollNo}', 'ABSENT')" title="Mark Absent">
                                ✗ Absent
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Expose override function globally for inline buttons
    window.overrideStatus = function(rollNo, newStatus) {
        if (!activeSession) return;
        window.DataStore.overrideStudentStatus(activeSession.roomCode, rollNo, newStatus);
        const sessions = window.DataStore.getActiveSessions();
        activeSession = sessions[activeSession.roomCode];
        renderRosterAndStats();
    };

    // Copy Code Button
    document.getElementById("copyCodeBtn").addEventListener("click", () => {
        if (!activeSession) return;
        navigator.clipboard.writeText(activeSession.roomCode).then(() => {
            const btn = document.getElementById("copyCodeBtn");
            btn.textContent = "✓ Copied!";
            setTimeout(() => { btn.textContent = "📋 Copy Code"; }, 1500);
        });
    });

    // Roster search filtering
    document.getElementById("rosterSearchInput").addEventListener("input", () => {
        renderRosterAndStats();
    });

    // Simulate Student Joins (for fast evaluation demos)
    document.getElementById("simulateJoinBtn").addEventListener("click", () => {
        if (!activeSession) return;
        const roster = Object.values(activeSession.roster || {});
        const absentStudents = roster.filter(s => s.status === "ABSENT");

        if (absentStudents.length === 0) {
            alert("All students in this roster have already checked in!");
            return;
        }

        // Pick up to 2 absent students to simulate join
        const pickCount = Math.min(2, absentStudents.length);
        for (let i = 0; i < pickCount; i++) {
            const targetStudent = absentStudents[i];
            const isReviewCase = i === 1 && Math.random() > 0.5; // occasionally test review case

            window.DataStore.recordStudentVerification(
                activeSession.roomCode,
                targetStudent,
                {
                    faceMatch: true,
                    livenessPass: true,
                    locationPass: !isReviewCase,
                    distance: isReviewCase ? "120m (Low GPS Accuracy)" : "7m"
                }
            );
        }

        const sessions = window.DataStore.getActiveSessions();
        activeSession = sessions[activeSession.roomCode];
        renderRosterAndStats();
    });

    // End Attendance Session
    document.getElementById("endSessionBtn").addEventListener("click", () => {
        if (!activeSession) return;
        if (confirm("Are you sure you want to end this attendance session? All unverified students will remain ABSENT.")) {
            window.DataStore.endAttendanceSession(activeSession.roomCode);
            alert(`Attendance session for ${activeSession.subject} finalized! Records archived.`);
            renderSetupView();
        }
    });

    // Export CSV Download
    document.getElementById("exportCsvBtn").addEventListener("click", () => {
        if (!activeSession) return;

        const roster = Object.values(activeSession.roster || {});
        const dateStr = new Date().toISOString().split("T")[0];
        const sanitizedSubject = activeSession.subject.replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `${activeSession.groupId}_${sanitizedSubject}_${dateStr}.csv`;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Roll No,Student Name,Email,Group,Subject,Status,Joined Time,Verification Mode,Teacher\n";

        roster.forEach(st => {
            const joinTime = st.joinedAt ? new Date(st.joinedAt).toLocaleTimeString() : "N/A";
            const mode = st.verificationMode || "None";
            csvContent += `"${st.rollNo}","${st.name}","${st.email}","${activeSession.groupId}","${activeSession.subject}","${st.status}","${joinTime}","${mode}","${activeSession.teacherName}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});
