import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Mapping of Firebase error codes to user-friendly messages
const FIREBASE_ERRORS = {
    "auth/email-already-in-use": "That email is already registered.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password.",
};

// Function to validate form inputs based on mode (login/signup)
function validate(mode, form) {
    const errors = {};
    if (mode === "signup" && !form.displayName.trim()) errors.displayName = "Display name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Enter a valid email.";
    if (!form.password) errors.password = "Password is required.";
    else if (mode === "signup" && form.password.length < 6) errors.password = "Password must be at least 6 characters.";
    return errors;
}

// Main Auth component for handling user login and signup
export default function Auth() {
    const navigate = useNavigate();
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ displayName: "", email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [loading, setLoading] = useState(false);
    //
    const handle = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const switchMode = (next) => {
        setMode(next);
        setErrors({});
        setApiError("");
    };

    const submit = async () => {
        const fieldErrors = validate(mode, form);
        if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

        setLoading(true);
        setApiError("");
        try {
            if (mode === "signup") {
                const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
                await setDoc(doc(db, "users", cred.user.uid), {
                    uid: cred.user.uid,
                    displayName: form.displayName.trim(),
                    email: form.email.toLowerCase(),
                    bio: "",
                    favouriteGenre: "",
                    createdAt: new Date().toISOString(),
                });
            } else {
                await signInWithEmailAndPassword(auth, form.email, form.password);
            }
            navigate("/");
        } catch (err) {
            setApiError(FIREBASE_ERRORS[err.code] || "Something went wrong. Please try again.");
        }
        setLoading(false);
    };

    return (
        <main className="auth-root page-bg" aria-label="Authentication">
            <div className="auth-card fade-up">
                <div className="auth-logo">
                    <div className="auth-logo-icon" aria-hidden="true"></div>
                    <span className="auth-logo-text">ReaderHub</span>
                </div>

                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 4 }}>
                    {mode === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
                    {mode === "login" ? "Sign in to continue your reading journey" : "Join thousands of readers today"}
                </p>

                <div className="auth-tabs" role="tablist" aria-label="Sign in or sign up">
                    <button
                        className={`auth-tab ${mode === "login" ? "active" : ""}`}
                        role="tab" aria-selected={mode === "login"}
                        onClick={() => switchMode("login")}
                    >Sign In</button>
                    <button
                        className={`auth-tab ${mode === "signup" ? "active" : ""}`}
                        role="tab" aria-selected={mode === "signup"}
                        onClick={() => switchMode("signup")}
                    >Sign Up</button>
                </div>

                {mode === "signup" && (
                    <div className="form-group">
                        <label className="form-label" htmlFor="displayName">Display Name</label>
                        <input
                            id="displayName" name="displayName" type="text"
                            className={`form-input ${errors.displayName ? "error" : ""}`}
                            value={form.displayName} onChange={handle}
                            placeholder="Ada Lovelace"
                            aria-describedby={errors.displayName ? "displayName-error" : undefined}
                            aria-invalid={!!errors.displayName}
                        />
                        {errors.displayName && <p id="displayName-error" className="form-error" role="alert">{errors.displayName}</p>}
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input
                        id="email" name="email" type="email"
                        className={`form-input ${errors.email ? "error" : ""}`}
                        value={form.email} onChange={handle}
                        placeholder="you@example.com"
                        aria-describedby={errors.email ? "email-error" : undefined}
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && <p id="email-error" className="form-error" role="alert">{errors.email}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input
                        id="password" name="password" type="password"
                        className={`form-input ${errors.password ? "error" : ""}`}
                        value={form.password} onChange={handle}
                        placeholder="••••••••"
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                        aria-describedby={errors.password ? "password-error" : undefined}
                        aria-invalid={!!errors.password}
                    />
                    {errors.password && <p id="password-error" className="form-error" role="alert">{errors.password}</p>}
                </div>

                {apiError && <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>{apiError}</div>}

                <button
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                    onClick={submit}
                    disabled={loading}
                    aria-label={mode === "login" ? "Sign in" : "Create account"}
                >
                    {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
                </button>
            </div>
        </main>
    );
}
