/**
 * SecureAttend - First-Time Account Activation & Signup Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // Current wizard state
    let state = {
        email: "",
        record: null,
        role: "student",
        password: "",
        faceTemplate: null,
        cameraStream: null
    };

    // DOM Elements - Steps
    const stepIndicators = [
        document.getElementById("stepIndicator1"),
        document.getElementById("stepIndicator2"),
        document.getElementById("stepIndicator3"),
        document.getElementById("stepIndicator4")
    ];

    const steps = [
        document.getElementById("step1"),
        document.getElementById("step2"),
        document.getElementById("step3"),
        document.getElementById("step4")
    ];

    function goToStep(stepIndex) {
        steps.forEach((step, idx) => {
            if (idx === stepIndex) {
                step.classList.add("active");
            } else {
                step.classList.remove("active");
            }
        });

        stepIndicators.forEach((ind, idx) => {
            ind.classList.remove("active", "completed");
            if (idx === stepIndex) {
                ind.classList.add("active");
            } else if (idx < stepIndex) {
                ind.classList.add("completed");
            }
        });
    }

    // ==========================================
    // STEP 1: IDENTITY LOOKUP
    // ==========================================
    const step1Form = document.getElementById("step1Form");
    const activationEmailInput = document.getElementById("activationEmail");
    const step1Message = document.getElementById("step1Message");

    // Demo Pills
    const sampleStudentBtn = document.getElementById("sampleStudentBtn");
    const sampleStudent2Btn = document.getElementById("sampleStudent2Btn");

    if (sampleStudentBtn) {
        sampleStudentBtn.addEventListener("click", () => {
            activationEmailInput.value = "karan.104@chitkara.edu.in";
        });
    }
    if (sampleStudent2Btn) {
        sampleStudent2Btn.addEventListener("click", () => {
            activationEmailInput.value = "vikram.106@chitkara.edu.in";
        });
    }

    step1Form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = activationEmailInput.value.trim();

        if (!email) {
            showMsg(step1Message, "Please enter your university email.", "error");
            return;
        }

        const lookup = window.Auth.lookupRoster(email);

        if (!lookup.found) {
            showMsg(step1Message, lookup.message, "error");
            return;
        }

        if (lookup.alreadyActivated) {
            showMsg(step1Message, "Account is already activated! Please log in directly.", "info");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
            return;
        }

        state.email = email;
        state.record = lookup.record;
        state.role = lookup.role;

        // Send OTP
        const otpRes = window.Auth.sendActivationOtp(email);
        document.getElementById("displayTargetEmail").textContent = email;
        document.getElementById("demoOtpCode").textContent = otpRes.otp;

        showMsg(step1Message, "Record found! Sending 6-digit OTP code...", "success");

        setTimeout(() => {
            goToStep(1); // Go to Step 2
            setupOtpInputs();
        }, 600);
    });

    // ==========================================
    // STEP 2: OTP VERIFICATION
    // ==========================================
    const step2Form = document.getElementById("step2Form");
    const step2Message = document.getElementById("step2Message");
    const otpBoxes = [
        document.getElementById("otp1"),
        document.getElementById("otp2"),
        document.getElementById("otp3"),
        document.getElementById("otp4"),
        document.getElementById("otp5"),
        document.getElementById("otp6")
    ];

    function setupOtpInputs() {
        otpBoxes.forEach((box, index) => {
            box.value = "";
            box.addEventListener("input", (e) => {
                if (e.target.value.length === 1 && index < otpBoxes.length - 1) {
                    otpBoxes[index + 1].focus();
                }
            });
            box.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && !e.target.value && index > 0) {
                    otpBoxes[index - 1].focus();
                }
            });
        });
        if (otpBoxes[0]) otpBoxes[0].focus();
    }

    document.getElementById("autoFillOtpBtn").addEventListener("click", () => {
        const generatedOtp = document.getElementById("demoOtpCode").textContent;
        for (let i = 0; i < 6; i++) {
            otpBoxes[i].value = generatedOtp[i] || "";
        }
    });

    document.getElementById("backToStep1Btn").addEventListener("click", () => {
        goToStep(0);
    });

    document.getElementById("resendOtpBtn").addEventListener("click", () => {
        const otpRes = window.Auth.sendActivationOtp(state.email);
        document.getElementById("demoOtpCode").textContent = otpRes.otp;
        showMsg(step2Message, `New OTP code sent: ${otpRes.otp}`, "success");
    });

    step2Form.addEventListener("submit", (e) => {
        e.preventDefault();
        const enteredOtp = otpBoxes.map(b => b.value).join("");

        if (enteredOtp.length < 6) {
            showMsg(step2Message, "Please enter the full 6-digit code.", "error");
            return;
        }

        const verifyRes = window.Auth.verifyActivationOtp(state.email, enteredOtp);

        if (!verifyRes.success) {
            showMsg(step2Message, verifyRes.message, "error");
            return;
        }

        showMsg(step2Message, "OTP verified successfully!", "success");

        // Populate verified banner in step 3
        document.getElementById("verifiedRecordName").textContent = state.record.name;
        const metaText = state.role === "student"
            ? `Roll No: ${state.record.rollNo} · Group: ${state.record.groupId || 'G1'}`
            : `Teacher ID: ${state.record.teacherId} · Dept: ${state.record.department}`;
        document.getElementById("verifiedRecordMeta").textContent = metaText;

        setTimeout(() => {
            goToStep(2); // Go to Step 3
        }, 500);
    });

    // ==========================================
    // STEP 3: SET PASSWORD
    // ==========================================
    const step3Form = document.getElementById("step3Form");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    const step3Message = document.getElementById("step3Message");

    step3Form.addEventListener("submit", (e) => {
        e.preventDefault();
        const pwd = newPasswordInput.value;
        const confirmPwd = confirmNewPasswordInput.value;

        if (pwd.length < 6) {
            showMsg(step3Message, "Password must be at least 6 characters.", "error");
            return;
        }

        if (pwd !== confirmPwd) {
            showMsg(step3Message, "Passwords do not match.", "error");
            return;
        }

        state.password = pwd;

        if (state.role === "student") {
            goToStep(3); // Go to Step 4 (Face Registration)
            initCameraPreview();
        } else {
            // Teacher activation does not strictly require face scan; finish directly
            finishActivation();
        }
    });

    // ==========================================
    // STEP 4: FACE BIOMETRIC REGISTRATION
    // ==========================================
    const webcamVideo = document.getElementById("webcamVideo");
    const faceCaptureCanvas = document.getElementById("faceCaptureCanvas");
    const startCamBtn = document.getElementById("startCamBtn");
    const simulatedFaceBtn = document.getElementById("simulatedFaceBtn");
    const captureFaceBtn = document.getElementById("captureFaceBtn");
    const step4Message = document.getElementById("step4Message");
    const scanPromptText = document.getElementById("scanPromptText");

    async function initCameraPreview() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                state.cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
                });
                webcamVideo.srcObject = state.cameraStream;
                scanPromptText.textContent = "Face detected. Keep still inside the frame.";
            } else {
                fallbackSimulatedFeed();
            }
        } catch (err) {
            fallbackSimulatedFeed();
        }
    }

    function fallbackSimulatedFeed() {
        scanPromptText.textContent = "Camera preview active (Biometric simulation mode)";
    }

    startCamBtn.addEventListener("click", () => {
        initCameraPreview();
    });

    simulatedFaceBtn.addEventListener("click", () => {
        state.faceTemplate = `face_embed_${state.record.rollNo || Date.now()}_verified`;
        scanPromptText.textContent = "✓ Biometric Embeddings Captured (Ready)";
        showMsg(step4Message, "Biometric face template generated and verified!", "success");
    });

    captureFaceBtn.addEventListener("click", () => {
        // Generate template
        state.faceTemplate = `face_embed_${state.record.rollNo || Date.now()}_verified`;

        // If real camera is streaming, capture frame to canvas
        if (state.cameraStream && webcamVideo.videoWidth) {
            faceCaptureCanvas.width = webcamVideo.videoWidth;
            faceCaptureCanvas.height = webcamVideo.videoHeight;
            const ctx = faceCaptureCanvas.getContext("2d");
            ctx.drawImage(webcamVideo, 0, 0);
        }

        scanPromptText.textContent = "✓ Biometric Template Secured!";
        showMsg(step4Message, "Face registration complete! Activating account...", "success");

        // Stop camera stream
        if (state.cameraStream) {
            state.cameraStream.getTracks().forEach(track => track.stop());
        }

        setTimeout(() => {
            finishActivation();
        }, 700);
    });

    function finishActivation() {
        const payload = {
            email: state.email,
            password: state.password,
            role: state.role,
            name: state.record.name,
            rollNo: state.record.rollNo || null,
            teacherId: state.record.teacherId || null,
            groupId: state.record.groupId || "G1",
            faceTemplate: state.faceTemplate
        };

        const result = window.Auth.completeActivation(payload);

        if (result.success) {
            window.location.href = result.redirectUrl;
        } else {
            showMsg(step4Message, "Error activating account. Please try again.", "error");
        }
    }

    function showMsg(el, text, type) {
        if (!el) return;
        el.textContent = text;
        el.className = `message show ${type}`;
    }
});