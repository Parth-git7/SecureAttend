/**
 * SecureAttend - Admin Dashboard Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // Role Guard
    const user = window.Auth.requireAuth(["admin"]);
    if (!user) return;

    // DOM Elements - Navbar
    document.getElementById("navAdminName").textContent = user.name;
    document.getElementById("userAvatar").textContent = "A";

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        window.Auth.logout();
    });

    // Reset Master Database
    document.getElementById("resetDbBtn").addEventListener("click", () => {
        if (confirm("Reset master database back to initial seed state? This will clear temporary sessions and restore default rosters.")) {
            window.DataStore.resetDatabase();
            alert("Master database reset successfully!");
            renderAll();
        }
    });

    // ==========================================
    // TABS CONTROLLER
    // ==========================================
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTabId = btn.getAttribute("data-tab");

            tabBtns.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.classList.remove("active"));

            btn.classList.add("active");
            const panel = document.getElementById(targetTabId);
            if (panel) panel.classList.add("active");
        });
    });

    // Modal Helpers
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add("open");
    };

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove("open");
    };

    document.getElementById("openAddStudentModalBtn").addEventListener("click", () => {
        populateGroupSelectOptions("newStudentGroup");
        openModal("addStudentModal");
    });

    document.getElementById("openAddTeacherModalBtn").addEventListener("click", () => {
        openModal("addTeacherModal");
    });

    document.getElementById("openAddGroupModalBtn").addEventListener("click", () => {
        openModal("addGroupModal");
    });

    function populateGroupSelectOptions(selectId) {
        const groups = window.DataStore.getGroups();
        const sel = document.getElementById(selectId);
        if (sel) {
            sel.innerHTML = groups.map(g => `<option value="${g.id}">${g.name}</option>`).join("");
        }
    }

    // ==========================================
    // MASTER STUDENTS
    // ==========================================
    const adminStudentSearch = document.getElementById("adminStudentSearch");
    adminStudentSearch.addEventListener("input", () => {
        renderStudents();
    });

    function renderStudents() {
        const students = window.DataStore.getStudents();
        const query = (adminStudentSearch.value || "").toLowerCase().trim();

        const filtered = students.filter(s =>
            s.rollNo.toLowerCase().includes(query) ||
            s.name.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            (s.groupId && s.groupId.toLowerCase().includes(query))
        );

        const tbody = document.getElementById("adminStudentsTableBody");
        document.getElementById("adminTotalStudents").textContent = students.length;

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 25px;">
                        No student records found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(s => {
            const isBio = s.faceTemplate ? true : false;
            const isAct = s.status === "active";

            return `
                <tr>
                    <td><strong>${escapeHtml(s.rollNo)}</strong></td>
                    <td>${escapeHtml(s.name)}</td>
                    <td><span style="color: var(--text-muted); font-size: 13px;">${escapeHtml(s.email)}</span></td>
                    <td><span class="role-badge student" style="font-size: 10px;">${escapeHtml(s.groupId || 'G1')}</span></td>
                    <td>
                        <span class="status-badge ${isBio ? 'badge-present' : 'badge-review'}">
                            ${isBio ? '✓ Registered' : '⚠️ Pending'}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${isAct ? 'badge-present' : 'badge-absent'}">
                            ${isAct ? 'Active' : 'Unactivated'}
                        </span>
                    </td>
                    <td>
                        <button type="button" class="icon-btn btn-absent" onclick="deleteStudent('${s.rollNo}')" title="Delete Student">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    window.deleteStudent = function(rollNo) {
        if (confirm(`Remove student ${rollNo} from master database?`)) {
            let students = window.DataStore.getStudents();
            students = students.filter(s => s.rollNo !== rollNo);
            window.DataStore.saveStudents(students);
            renderAll();
        }
    };

    // Add Student Form
    document.getElementById("addStudentForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const rollNo = document.getElementById("newStudentRoll").value.trim();
        const name = document.getElementById("newStudentName").value.trim();
        const email = document.getElementById("newStudentEmail").value.trim().toLowerCase();
        const groupId = document.getElementById("newStudentGroup").value;

        const students = window.DataStore.getStudents();
        if (students.some(s => s.rollNo === rollNo || s.email.toLowerCase() === email)) {
            alert("A student with this roll number or email already exists in master roster!");
            return;
        }

        students.push({
            rollNo: rollNo,
            name: name,
            email: email,
            groupId: groupId,
            status: "pending_activation",
            faceTemplate: null
        });

        window.DataStore.saveStudents(students);
        closeModal("addStudentModal");
        e.target.reset();
        renderAll();
    });

    // ==========================================
    // MASTER TEACHERS
    // ==========================================
    function renderTeachers() {
        const teachers = window.DataStore.getTeachers();
        const tbody = document.getElementById("adminTeachersTableBody");
        document.getElementById("adminTotalTeachers").textContent = teachers.length;

        tbody.innerHTML = teachers.map(t => {
            const subStr = (t.subjects || []).join(", ") || "General";
            return `
                <tr>
                    <td><strong>${escapeHtml(t.teacherId)}</strong></td>
                    <td>${escapeHtml(t.name)}</td>
                    <td><span style="color: var(--text-muted); font-size: 13px;">${escapeHtml(t.email)}</span></td>
                    <td>${escapeHtml(t.department || 'Computer Science')}</td>
                    <td><span style="font-size: 12px; color: var(--accent-teacher); font-weight: 600;">${escapeHtml(subStr)}</span></td>
                    <td>
                        <button type="button" class="icon-btn btn-absent" onclick="deleteTeacher('${t.teacherId}')" title="Delete Teacher">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    window.deleteTeacher = function(teacherId) {
        if (confirm(`Remove teacher ${teacherId} from faculty database?`)) {
            let teachers = window.DataStore.getTeachers();
            teachers = teachers.filter(t => t.teacherId !== teacherId);
            window.DataStore.saveTeachers(teachers);
            renderAll();
        }
    };

    // Add Teacher Form
    document.getElementById("addTeacherForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const teacherId = document.getElementById("newTeacherId").value.trim();
        const name = document.getElementById("newTeacherName").value.trim();
        const email = document.getElementById("newTeacherEmail").value.trim().toLowerCase();
        const dept = document.getElementById("newTeacherDept").value.trim();

        const teachers = window.DataStore.getTeachers();
        if (teachers.some(t => t.teacherId === teacherId || t.email.toLowerCase() === email)) {
            alert("A teacher with this ID or email already exists!");
            return;
        }

        teachers.push({
            teacherId: teacherId,
            name: name,
            email: email,
            department: dept,
            subjects: ["Artificial Intelligence", "Operating Systems"],
            status: "active"
        });

        window.DataStore.saveTeachers(teachers);
        closeModal("addTeacherModal");
        e.target.reset();
        renderAll();
    });

    // ==========================================
    // MASTER GROUPS
    // ==========================================
    function renderGroups() {
        const groups = window.DataStore.getGroups();
        const students = window.DataStore.getStudents();
        const tbody = document.getElementById("adminGroupsTableBody");
        document.getElementById("adminTotalGroups").textContent = groups.length;

        tbody.innerHTML = groups.map(g => {
            const count = students.filter(s => s.groupId === g.id).length;
            return `
                <tr>
                    <td><span class="role-badge student" style="font-size: 11px;">${escapeHtml(g.id)}</span></td>
                    <td><strong>${escapeHtml(g.name)}</strong></td>
                    <td>${escapeHtml(g.department)}</td>
                    <td>${escapeHtml(g.semester)}</td>
                    <td><span style="font-weight: 700; color: var(--primary);">${count} Students</span></td>
                    <td>
                        <button type="button" class="icon-btn btn-absent" onclick="deleteGroup('${g.id}')" title="Delete Group">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    window.deleteGroup = function(groupId) {
        if (confirm(`Delete group ${groupId}?`)) {
            let groups = window.DataStore.getGroups();
            groups = groups.filter(g => g.id !== groupId);
            window.DataStore.saveGroups(groups);
            renderAll();
        }
    };

    // Add Group Form
    document.getElementById("addGroupForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById("newGroupId").value.trim().toUpperCase();
        const name = document.getElementById("newGroupName").value.trim();
        const dept = document.getElementById("newGroupDept").value.trim();
        const sem = document.getElementById("newGroupSem").value.trim();

        const groups = window.DataStore.getGroups();
        if (groups.some(g => g.id === id)) {
            alert("A group with this ID already exists!");
            return;
        }

        groups.push({
            id: id,
            name: name,
            department: dept,
            semester: sem
        });

        window.DataStore.saveGroups(groups);
        closeModal("addGroupModal");
        e.target.reset();
        renderAll();
    });

    function renderAll() {
        renderStudents();
        renderTeachers();
        renderGroups();
    }

    renderAll();

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});
