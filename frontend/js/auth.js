/**
 * SecureAttend - Core Auth & Data Layer
 * Handles Master Roster seeding, User Authentication, Sessions, and Attendance storage.
 */

const STORAGE_KEYS = {
    MASTER_STUDENTS: "secureAttend_masterStudents",
    MASTER_TEACHERS: "secureAttend_masterTeachers",
    MASTER_GROUPS: "secureAttend_masterGroups",
    USERS: "secureAttend_users",
    CURRENT_USER: "secureAttend_currentUser",
    ACTIVE_SESSIONS: "secureAttend_activeSessions",
    ATTENDANCE_HISTORY: "secureAttend_attendanceHistory",
    PENDING_OTP: "secureAttend_pendingOtp"
};

// Initial Seed Data for the Master Database
const DEFAULT_GROUPS = [
    { id: "G1", name: "Group 1 (CSE)", department: "Computer Science & Engineering", semester: "6th Semester" },
    { id: "G2", name: "Group 2 (AI/ML)", department: "Artificial Intelligence & Data Science", semester: "6th Semester" },
    { id: "G3", name: "Group 3 (CyberSec)", department: "Cybersecurity & Forensics", semester: "6th Semester" }
];

const DEFAULT_SUBJECTS = [
    "Artificial Intelligence",
    "Machine Learning",
    "Operating Systems",
    "Computer Networks",
    "Cloud Computing",
    "Cybersecurity & Cryptography"
];

const DEFAULT_STUDENTS = [
    { rollNo: "101", name: "Rahul Sharma", email: "rahul.101@chitkara.edu.in", groupId: "G1", status: "active", faceTemplate: "face_embed_101_verified" },
    { rollNo: "102", name: "Aman Gupta", email: "aman.102@chitkara.edu.in", groupId: "G1", status: "active", faceTemplate: "face_embed_102_verified" },
    { rollNo: "103", name: "Priya Kaur", email: "priya.103@chitkara.edu.in", groupId: "G1", status: "active", faceTemplate: "face_embed_103_verified" },
    { rollNo: "104", name: "Karan Singla", email: "karan.104@chitkara.edu.in", groupId: "G1", status: "pending_activation", faceTemplate: null },
    { rollNo: "105", name: "Sneha Patel", email: "sneha.105@chitkara.edu.in", groupId: "G1", status: "active", faceTemplate: "face_embed_105_verified" },
    { rollNo: "106", name: "Vikram Malhotra", email: "vikram.106@chitkara.edu.in", groupId: "G1", status: "pending_activation", faceTemplate: null },
    { rollNo: "107", name: "Ananya Roy", email: "ananya.107@chitkara.edu.in", groupId: "G1", status: "active", faceTemplate: "face_embed_107_verified" },
    { rollNo: "108", name: "Rohan Verma", email: "rohan.108@chitkara.edu.in", groupId: "G1", status: "active", faceTemplate: "face_embed_108_verified" },
    { rollNo: "109", name: "Divya Joshi", email: "divya.109@chitkara.edu.in", groupId: "G1", status: "active", faceTemplate: "face_embed_109_verified" },
    { rollNo: "110", name: "Arjun Mehta", email: "arjun.110@chitkara.edu.in", groupId: "G1", status: "active", faceTemplate: "face_embed_110_verified" },
    // Group G2 Students
    { rollNo: "121", name: "Tanvi Saxena", email: "tanvi.121@chitkara.edu.in", groupId: "G2", status: "active", faceTemplate: "face_embed_121_verified" },
    { rollNo: "122", name: "Harsh Vardhan", email: "harsh.122@chitkara.edu.in", groupId: "G2", status: "active", faceTemplate: "face_embed_122_verified" },
    { rollNo: "123", name: "Simran Bhatia", email: "simran.123@chitkara.edu.in", groupId: "G2", status: "active", faceTemplate: "face_embed_123_verified" },
    { rollNo: "124", name: "Deepak Kumar", email: "deepak.124@chitkara.edu.in", groupId: "G2", status: "pending_activation", faceTemplate: null }
];

const DEFAULT_TEACHERS = [
    { teacherId: "T101", name: "Dr. Sandeep Sharma", email: "sharma.t101@chitkara.edu.in", department: "Computer Science", subjects: ["Artificial Intelligence", "Machine Learning"], status: "active" },
    { teacherId: "T102", name: "Prof. Neha Verma", email: "verma.t102@chitkara.edu.in", department: "Computer Science", subjects: ["Operating Systems", "Cloud Computing"], status: "active" },
    { teacherId: "T103", name: "Dr. Rajesh Kapoor", email: "kapoor.t103@chitkara.edu.in", department: "Cybersecurity", subjects: ["Computer Networks", "Cybersecurity & Cryptography"], status: "active" }
];

// Pre-activated Login Accounts (Default password is 'password123' for all demo accounts)
const DEFAULT_USERS = [
    {
        id: "usr_admin",
        name: "System Admin",
        email: "admin@chitkara.edu.in",
        password: "password123",
        role: "admin",
        createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
        id: "usr_t101",
        teacherId: "T101",
        name: "Dr. Sandeep Sharma",
        email: "sharma.t101@chitkara.edu.in",
        password: "password123",
        role: "teacher",
        department: "Computer Science",
        subjects: ["Artificial Intelligence", "Machine Learning"],
        createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
        id: "usr_s101",
        rollNo: "101",
        name: "Rahul Sharma",
        email: "rahul.101@chitkara.edu.in",
        password: "password123",
        role: "student",
        groupId: "G1",
        faceTemplate: "face_embed_101_verified",
        createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
        id: "usr_s102",
        rollNo: "102",
        name: "Aman Gupta",
        email: "aman.102@chitkara.edu.in",
        password: "password123",
        role: "student",
        groupId: "G1",
        faceTemplate: "face_embed_102_verified",
        createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
        id: "usr_s103",
        rollNo: "103",
        name: "Priya Kaur",
        email: "priya.103@chitkara.edu.in",
        password: "password123",
        role: "student",
        groupId: "G1",
        faceTemplate: "face_embed_103_verified",
        createdAt: "2026-01-01T00:00:00.000Z"
    }
];

const DEFAULT_ATTENDANCE_HISTORY = [
    {
        id: "att_001",
        roomCode: "6B91P",
        subject: "Artificial Intelligence",
        group: "G1",
        teacherName: "Dr. Sandeep Sharma",
        date: "2026-08-14",
        time: "10:15 AM",
        rollNo: "101",
        studentName: "Rahul Sharma",
        status: "PRESENT",
        verificationDetails: { face: true, liveness: true, location: true }
    },
    {
        id: "att_002",
        roomCode: "4N28Q",
        subject: "Operating Systems",
        group: "G1",
        teacherName: "Prof. Neha Verma",
        date: "2026-08-15",
        time: "02:30 PM",
        rollNo: "101",
        studentName: "Rahul Sharma",
        status: "PRESENT",
        verificationDetails: { face: true, liveness: true, location: true }
    }
];

/**
 * Initialize Master Database if not already present
 */
function initMasterDatabase(forceReset = false) {
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.MASTER_STUDENTS)) {
        localStorage.setItem(STORAGE_KEYS.MASTER_STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.MASTER_TEACHERS)) {
        localStorage.setItem(STORAGE_KEYS.MASTER_TEACHERS, JSON.stringify(DEFAULT_TEACHERS));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.MASTER_GROUPS)) {
        localStorage.setItem(STORAGE_KEYS.MASTER_GROUPS, JSON.stringify(DEFAULT_GROUPS));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSIONS)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSIONS, JSON.stringify({}));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.ATTENDANCE_HISTORY)) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE_HISTORY, JSON.stringify(DEFAULT_ATTENDANCE_HISTORY));
    }
}

// Auto-run initialization on script load
initMasterDatabase();

// ==========================================
// Authentication & User Management API
// ==========================================

const Auth = {
    /**
     * Get currently logged-in user
     */
    getCurrentUser() {
        try {
            const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Check authentication and role guard
     */
    requireAuth(allowedRoles = []) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = "login.html";
            return null;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            // Redirect to appropriate dashboard based on actual role
            if (user.role === "student") window.location.href = "student-dashboard.html";
            else if (user.role === "teacher") window.location.href = "teacher-dashboard.html";
            else if (user.role === "admin") window.location.href = "admin-dashboard.html";
            return null;
        }
        return user;
    },

    /**
     * User Login
     */
    login(email, password) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
        const normalizedEmail = email.trim().toLowerCase();
        const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

        if (!user) {
            return {
                success: false,
                message: "No account found with this email. Please activate your account first."
            };
        }

        if (user.password !== password) {
            return {
                success: false,
                message: "Incorrect password. Please try again."
            };
        }

        // Set session
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        localStorage.setItem("isLoggedIn", "true");

        return {
            success: true,
            user: user,
            redirectUrl: this.getDashboardUrl(user.role)
        };
    },

    /**
     * Get redirect URL by role
     */
    getDashboardUrl(role) {
        switch (role) {
            case "student": return "student-dashboard.html";
            case "teacher": return "teacher-dashboard.html";
            case "admin": return "admin-dashboard.html";
            default: return "login.html";
        }
    },

    /**
     * Logout
     */
    logout() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem("isLoggedIn");
        window.location.href = "login.html";
    },

    /**
     * Step 1 of Activation: Lookup email in master roster
     */
    lookupRoster(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.MASTER_STUDENTS) || "[]");
        const teachers = JSON.parse(localStorage.getItem(STORAGE_KEYS.MASTER_TEACHERS) || "[]");
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

        // Check if user account is already fully activated
        const existingUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
        if (existingUser) {
            return {
                found: true,
                alreadyActivated: true,
                message: "Account already exists! Please proceed to login.",
                user: existingUser
            };
        }

        // Check Student master roster
        const studentMatch = students.find(s => s.email.toLowerCase() === normalizedEmail);
        if (studentMatch) {
            return {
                found: true,
                alreadyActivated: false,
                role: "student",
                record: studentMatch,
                message: `Found student record for ${studentMatch.name} (Roll No: ${studentMatch.rollNo})`
            };
        }

        // Check Teacher master roster
        const teacherMatch = teachers.find(t => t.email.toLowerCase() === normalizedEmail);
        if (teacherMatch) {
            return {
                found: true,
                alreadyActivated: false,
                role: "teacher",
                record: teacherMatch,
                message: `Found teacher record for ${teacherMatch.name} (ID: ${teacherMatch.teacherId})`
            };
        }

        return {
            found: false,
            message: "Email not found in university master roster. Contact university admin."
        };
    },

    /**
     * Step 2 of Activation: Send OTP (simulated 6-digit OTP)
     */
    sendActivationOtp(email) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpData = {
            email: email.trim().toLowerCase(),
            otp: otpCode,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
        };
        localStorage.setItem(STORAGE_KEYS.PENDING_OTP, JSON.stringify(otpData));
        return {
            success: true,
            otp: otpCode,
            message: `A 6-digit verification code was sent to ${email}.`
        };
    },

    /**
     * Step 2 Verify OTP
     */
    verifyActivationOtp(email, enteredOtp) {
        const storedOtpJson = localStorage.getItem(STORAGE_KEYS.PENDING_OTP);
        if (!storedOtpJson) {
            return { success: false, message: "No verification request found. Request a new OTP." };
        }
        const otpData = JSON.parse(storedOtpJson);
        if (otpData.email !== email.trim().toLowerCase()) {
            return { success: false, message: "Email mismatch. Please start over." };
        }
        if (Date.now() > otpData.expiresAt) {
            return { success: false, message: "OTP has expired. Please request a new one." };
        }
        // Accepts the generated OTP or fallback master OTP "123456" for demo convenience
        if (otpData.otp === enteredOtp.trim() || enteredOtp.trim() === "123456") {
            return { success: true, message: "Email verified successfully!" };
        }
        return { success: false, message: "Invalid OTP code. Please enter the correct 6 digits." };
    },

    /**
     * Complete Activation & Register Account (with optional face template)
     */
    completeActivation(accountData) {
        const { email, password, role, name, rollNo, teacherId, groupId, faceTemplate } = accountData;
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");

        const newUser = {
            id: `usr_${Date.now()}`,
            name: name,
            email: email.trim().toLowerCase(),
            password: password,
            role: role,
            rollNo: rollNo || null,
            teacherId: teacherId || null,
            groupId: groupId || "G1",
            faceTemplate: faceTemplate || (role === "student" ? `face_embed_${rollNo || Date.now()}_verified` : null),
            createdAt: new Date().toISOString()
        };

        // Add to users
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

        // Update status in Master Roster
        if (role === "student" && rollNo) {
            const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.MASTER_STUDENTS) || "[]");
            const idx = students.findIndex(s => s.rollNo === rollNo);
            if (idx !== -1) {
                students[idx].status = "active";
                students[idx].faceTemplate = newUser.faceTemplate;
                localStorage.setItem(STORAGE_KEYS.MASTER_STUDENTS, JSON.stringify(students));
            }
        }

        // Clean up pending OTP
        localStorage.removeItem(STORAGE_KEYS.PENDING_OTP);

        // Auto-login
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
        localStorage.setItem("isLoggedIn", "true");

        return {
            success: true,
            user: newUser,
            redirectUrl: this.getDashboardUrl(newUser.role)
        };
    }
};

// ==========================================
// Master Database & Session Store API
// ==========================================

const DataStore = {
    getGroups() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.MASTER_GROUPS) || "[]");
    },
    getSubjects() {
        return DEFAULT_SUBJECTS;
    },
    getStudents() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.MASTER_STUDENTS) || "[]");
    },
    getTeachers() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.MASTER_TEACHERS) || "[]");
    },
    getStudentsByGroup(groupId) {
        const students = this.getStudents();
        return students.filter(s => s.groupId === groupId);
    },

    saveStudents(students) {
        localStorage.setItem(STORAGE_KEYS.MASTER_STUDENTS, JSON.stringify(students));
    },
    saveTeachers(teachers) {
        localStorage.setItem(STORAGE_KEYS.MASTER_TEACHERS, JSON.stringify(teachers));
    },
    saveGroups(groups) {
        localStorage.setItem(STORAGE_KEYS.MASTER_GROUPS, JSON.stringify(groups));
    },

    // Session Management (Teacher Room Creation & Student Joins)
    getActiveSessions() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSIONS) || "{}");
    },

    saveActiveSessions(sessions) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions));
    },

    /**
     * Create an Attendance Session (Teacher)
     */
    createAttendanceSession(teacher, groupId, subject, location) {
        const sessions = this.getActiveSessions();

        // Generate 5-character alphanumeric room code
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let roomCode = "";
        for (let i = 0; i < 5; i++) {
            roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Get full master student roster for this group
        const groupStudents = this.getStudentsByGroup(groupId);
        const rosterMap = {};

        // EVERY student in the group starts as ABSENT
        groupStudents.forEach(student => {
            rosterMap[student.rollNo] = {
                rollNo: student.rollNo,
                name: student.name,
                email: student.email,
                status: "ABSENT", // Initial state
                joinedAt: null,
                verificationMode: null,
                distance: null
            };
        });

        const newSession = {
            roomCode: roomCode,
            teacherId: teacher.teacherId || teacher.id,
            teacherName: teacher.name,
            groupId: groupId,
            subject: subject,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
            isActive: true,
            location: location || { latitude: 30.5165, longitude: 76.6592, classroom: "Lab 304 - Turing Block" },
            roster: rosterMap
        };

        sessions[roomCode] = newSession;
        this.saveActiveSessions(sessions);
        return newSession;
    },

    /**
     * End Attendance Session
     */
    endAttendanceSession(roomCode) {
        const sessions = this.getActiveSessions();
        const session = sessions[roomCode];
        if (!session) return null;

        session.isActive = false;
        session.endedAt = new Date().toISOString();
        this.saveActiveSessions(sessions);

        // Append to historical attendance archive
        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE_HISTORY) || "[]");
        Object.values(session.roster).forEach(record => {
            history.unshift({
                id: `att_${Date.now()}_${record.rollNo}`,
                roomCode: session.roomCode,
                subject: session.subject,
                group: session.groupId,
                teacherName: session.teacherName,
                date: new Date().toISOString().split("T")[0],
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                rollNo: record.rollNo,
                studentName: record.name,
                status: record.status,
                verificationDetails: record.verificationDetails || null
            });
        });
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE_HISTORY, JSON.stringify(history.slice(0, 100)));

        return session;
    },

    /**
     * Student joins room and updates verification status
     */
    recordStudentVerification(roomCode, student, verificationResult) {
        const sessions = this.getActiveSessions();
        const session = sessions[roomCode];

        if (!session) {
            return { success: false, message: "Room not found. Check the code." };
        }
        if (!session.isActive) {
            return { success: false, message: "This attendance session has already ended." };
        }
        if (new Date(session.expiresAt) < new Date()) {
            return { success: false, message: "Room code has expired." };
        }

        // Check if student belongs to this roster
        if (!session.roster[student.rollNo]) {
            return {
                success: false,
                message: `Roll No. ${student.rollNo} is not registered in Group ${session.groupId} roster for this class.`
            };
        }

        // Determine status based on 3-factor checks
        const { faceMatch, livenessPass, locationPass, distance } = verificationResult;
        let finalStatus = "ABSENT";
        let message = "";

        if (faceMatch && livenessPass && locationPass) {
            finalStatus = "PRESENT";
            message = "Attendance Verified! You are marked PRESENT.";
        } else if (!locationPass && faceMatch && livenessPass) {
            finalStatus = "REVIEW";
            message = "Location confidence low. Session flagged for Teacher Review.";
        } else if (!faceMatch || !livenessPass) {
            finalStatus = "REJECTED";
            message = "Biometric / Liveness check failed. Not verified.";
        } else {
            finalStatus = "REVIEW";
            message = "Verification inconclusive. Flagged for Teacher Review.";
        }

        // Update roster
        session.roster[student.rollNo] = {
            ...session.roster[student.rollNo],
            status: finalStatus,
            joinedAt: new Date().toISOString(),
            verificationMode: "3-Factor Biometric + GPS",
            distance: distance || "12m",
            verificationDetails: {
                face: faceMatch,
                liveness: livenessPass,
                location: locationPass
            }
        };

        sessions[roomCode] = session;
        this.saveActiveSessions(sessions);

        // Also record to user's local attendance history
        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE_HISTORY) || "[]");
        history.unshift({
            id: `att_${Date.now()}_${student.rollNo}`,
            roomCode: session.roomCode,
            subject: session.subject,
            group: session.groupId,
            teacherName: session.teacherName,
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            rollNo: student.rollNo,
            studentName: student.name,
            status: finalStatus,
            verificationDetails: { face: faceMatch, liveness: livenessPass, location: locationPass }
        });
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE_HISTORY, JSON.stringify(history.slice(0, 100)));

        return {
            success: true,
            status: finalStatus,
            message: message,
            session: session
        };
    },

    /**
     * Teacher manual override of student status (PRESENT / ABSENT / REVIEW)
     */
    overrideStudentStatus(roomCode, rollNo, newStatus) {
        const sessions = this.getActiveSessions();
        const session = sessions[roomCode];
        if (!session || !session.roster[rollNo]) return false;

        session.roster[rollNo].status = newStatus;
        session.roster[rollNo].overriddenByTeacher = true;
        sessions[roomCode] = session;
        this.saveActiveSessions(sessions);
        return true;
    },

    /**
     * Get attendance history for a student
     */
    getStudentAttendanceHistory(rollNo) {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE_HISTORY) || "[]");
        return history.filter(h => h.rollNo === rollNo);
    },

    /**
     * Reset master database to defaults
     */
    resetDatabase() {
        initMasterDatabase(true);
    }
};

// Make accessible globally
window.Auth = Auth;
window.DataStore = DataStore;
window.STORAGE_KEYS = STORAGE_KEYS;
