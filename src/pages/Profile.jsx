import { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot, collection, query, where } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const GENRES = [
    "", "Fiction", "Non-Fiction", "Mystery & Thriller", "Science Fiction",
    "Fantasy", "Romance", "Historical Fiction", "Biography", "Self-Help",
    "Horror", "Literary Fiction", "Graphic Novels", "Poetry", "Travel",
];

// 20 diverse avatars via DiceBear
const AVATAR_LIST = Array.from({ length: 20 }, (_, i) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky${i}`
);

function validate(form) {
    const errors = {};
    if (!form.displayName.trim()) errors.displayName = "Display name cannot be empty.";
    else if (form.displayName.trim().length > 50) errors.displayName = "Display name must be 50 characters or fewer.";
    if (form.bio.length > 300) errors.bio = "Bio must be 300 characters or fewer.";
    return errors;
}

export default function Profile() {
    const { user, profile, refreshProfile } = useAuth();

    // ── Profile form ────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        displayName: profile?.displayName || "",
        bio: profile?.bio || "",
        favouriteGenre: profile?.favouriteGenre || "",
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [apiError, setApiError] = useState("");

    // ── Avatar modal ─────────────────────────────────────────────────────────
    const [avatarModalOpen, setAvatarModalOpen] = useState(false);
    const [avatarSaving, setAvatarSaving] = useState(false);
    const [avatarError, setAvatarError] = useState("");

    // ── Milestones ───────────────────────────────────────────────────────────
    const [lifetimeCount, setLifetimeCount] = useState(0);
    const [goalCount, setGoalCount] = useState(0);
    //const [pagesToday, setPagesToday] = useState(0);
    //const [isEditingPages, setIsEditingPages] = useState(false);
    //const [tempPages, setTempPages] = useState(0);

    // Fetch milestone data from Firestore
    useEffect(() => {
        if (!user) return;

        // Books read lifetime + pages today from userStats
        const statsRef = doc(db, "userStats", user.uid);
        const unsubStats = onSnapshot(statsRef, (snap) => {
            if (snap.exists()) {
                setLifetimeCount(snap.data().lifetimeReadCount || 0);
                //setPagesToday(snap.data().pagesToday || 0);
                //setTempPages(snap.data().pagesToday || 0);
            }
        });

        // Current goal = books with status reading or not-started in reading_list
        const q = query(collection(db, "users", user.uid, "reading_list"));
        const unsubList = onSnapshot(q, (snap) => {
        const allBooks = snap.docs.map((d) => d.data());

        // 1. Books Read: Count only those marked as "finished"
        const finishedBooks = allBooks.filter((b) => b.status === "finished");
        setLifetimeCount(finishedBooks.length);

        // 2. On My List: Count books currently being read or not started
        const activeBooks = allBooks.filter((b) => 
            b.status === "reading" || b.status === "not-started"
        );
            setGoalCount(active.length);
        });

        return () => { unsubStats(); unsubList(); };
    }, [user]);

    const savePages = async () => {
        setIsEditingPages(false);
        setPagesToday(tempPages);
        try {
            await setDoc(doc(db, "userStats", user.uid), { pagesToday: parseInt(tempPages) }, { merge: true });
        } catch {
            // silently fail — not critical
        }
    };

    // ── Profile save ─────────────────────────────────────────────────────────
    const handle = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
        setSuccess(false);
    };

    const handleSave = async () => {
        const fieldErrors = validate(form);
        if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }

        setSaving(true);
        setApiError("");
        setSuccess(false);
        try {
            await setDoc(doc(db, "users", user.uid), {
                displayName: form.displayName.trim(),
                bio: form.bio.trim(),
                favouriteGenre: form.favouriteGenre,
            }, { merge: true });
            await refreshProfile();
            setSuccess(true);
        } catch {
            setApiError("Failed to save profile. Please try again.");
        }
        setSaving(false);
    };

    // ── Avatar save ───────────────────────────────────────────────────────────
    const handleAvatarChange = async (url) => {
        setAvatarSaving(true);
        setAvatarError("");
        try {
            await updateProfile(user, { photoURL: url });
            setAvatarModalOpen(false);
        } catch {
            setAvatarError("Failed to update avatar. Please try again.");
        }
        setAvatarSaving(false);
    };

    const initial = (form.displayName || user?.email || "?")[0].toUpperCase();
    const memberSince = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
        : "";

    const milestones = [
        { label: "Books Read", value: lifetimeCount },
        { label: "On My List", value: goalCount },
        //{ label: "Pages Today", value: pagesToday, isEditable: true },
    ];

    // Theme setting
    // 1. Sync the HTML attribute whenever the profile theme changes
    useEffect(() => {
        const currentTheme = profile?.theme || "light";
        document.documentElement.setAttribute("data-theme", currentTheme);
    }, [profile?.theme]);

    // 2. Function to toggle and save to Firestore
    const toggleTheme = async () => {
        const newTheme = profile?.theme === "dark" ? "light" : "dark";
        
        try {
            // Update the user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                theme: newTheme
            }, { merge: true });
            
            // Refresh the context so the UI updates immediately
            await refreshProfile(); 
        } catch (err) {
            console.error("Failed to save theme preference:", err);
        }
    };

    return (
        <div className="page-bg">
            <main className="page fade-up" aria-label="User profile">

                {/* ── Profile header ── */}
                <header className="profile-header">
                    <div style={{ position: "relative", display: "inline-block" }}>
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt="Profile avatar"
                                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--accent)" }}
                            />
                        ) : (
                            <div className="profile-avatar" aria-hidden="true">{initial}</div>
                        )}
                        <button
                            onClick={() => setAvatarModalOpen(true)}
                            aria-label="Change avatar"
                            style={{
                                position: "absolute", bottom: 0, right: -4,
                                width: 26, height: 26, borderRadius: "50%",
                                background: "var(--accent)", border: "2px solid var(--bg)",
                                color: "var(--bg)", fontSize: 12, display: "grid", placeItems: "center",
                                cursor: "pointer",
                            }}
                        >
                            ✎
                        </button>
                    </div>
                    <div>
                        <h1 className="profile-name">{profile?.displayName || "Your Profile"}</h1>
                        <p className="profile-meta">
                            {user?.email}
                            {memberSince ? ` · Member since ${memberSince}` : ""}
                        </p>

                        {/* Theme Toggle Button */}
                        <div className="theme-toggle-container" style={{ marginTop: '16px' }}>
                            <span className="profile-meta" style={{ marginBottom: '8px', display: 'block' }}>
                                {profile?.theme === "dark" ? "Dark Mode" : "Light Mode"}
                            </span>
                            <label className="theme-switch" aria-label="Toggle Dark Mode">
                                <input
                                    type="checkbox"
                                    onChange={toggleTheme}
                                    checked={profile?.theme === "dark"}
                                />
                                <span className="theme-slider round">
                                    <span className="icon-sun">☀️</span>
                                    <span className="icon-moon">🌙</span>
                                </span>
                            </label>
                        </div>                    
                            
                        {profile?.favouriteGenre && (
                            <span className="badge badge-blue" style={{ marginTop: 8 }}>
                                {profile.favouriteGenre}
                            </span>
                        )}
                    </div>
                </header>

                {/* ── Milestones ── */}
                <section aria-labelledby="milestones-heading" style={{ marginBottom: 36 }}>
                    <div className="section-heading">
                        <h2 id="milestones-heading">Milestones</h2>
                        <div className="section-heading-line" aria-hidden="true" />
                    </div>
                    <div className="milestones-grid" role="list">
                        {milestones.map((m, i) => (
                            <div key={i} className="milestone-card" role="listitem">
                                <span style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>
                                    {m.value}
                                </span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Edit profile form ── */}
                <section aria-labelledby="edit-heading">
                    <div className="section-heading">
                        <h2 id="edit-heading">Edit Profile</h2>
                        <div className="section-heading-line" aria-hidden="true" />
                    </div>

                    <div style={{ maxWidth: 480 }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="displayName">Display Name</label>
                            <input
                                id="displayName" name="displayName" type="text"
                                className={`form-input ${errors.displayName ? "error" : ""}`}
                                value={form.displayName} onChange={handle}
                                placeholder="Your name" maxLength={50}
                                aria-describedby={errors.displayName ? "name-error" : "name-hint"}
                                aria-invalid={!!errors.displayName}
                            />
                            <p id="name-hint" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                                {form.displayName.length}/50
                            </p>
                            {errors.displayName && <p id="name-error" className="form-error" role="alert">{errors.displayName}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="bio">Bio</label>
                            <textarea
                                id="bio" name="bio"
                                className={`form-textarea ${errors.bio ? "error" : ""}`}
                                value={form.bio} onChange={handle}
                                placeholder="Tell other readers a bit about yourself…"
                                maxLength={300}
                                aria-describedby={errors.bio ? "bio-error" : "bio-hint"}
                                aria-invalid={!!errors.bio}
                            />
                            <p id="bio-hint" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                                {form.bio.length}/300
                            </p>
                            {errors.bio && <p id="bio-error" className="form-error" role="alert">{errors.bio}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="favouriteGenre">Favourite Genre</label>
                            <select
                                id="favouriteGenre" name="favouriteGenre"
                                className="form-input form-select"
                                value={form.favouriteGenre} onChange={handle}
                                aria-label="Select your favourite genre"
                            >
                                {GENRES.map((g) => (
                                    <option key={g} value={g}>{g || "— Select a genre —"}</option>
                                ))}
                            </select>
                        </div>

                        {apiError && <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>{apiError}</div>}
                        {success && <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>Profile saved successfully!</div>}

                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                            aria-label="Save profile changes"
                        >
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </section>

                {/* ── Avatar selection modal ── */}
                {avatarModalOpen && (
                    <div
                        className="modal-overlay fade-in"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Choose your avatar"
                        onClick={(e) => e.target === e.currentTarget && setAvatarModalOpen(false)}
                    >
                        <div className="modal fade-up">
                            <button className="modal-close" onClick={() => setAvatarModalOpen(false)} aria-label="Close avatar picker">✕</button>
                            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 4 }}>Choose Your Avatar</h2>
                            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Click an avatar to set it as your profile picture.</p>

                            {avatarError && <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>{avatarError}</div>}

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(5, 1fr)",
                                    gap: 12,
                                    maxHeight: 320,
                                    overflowY: "auto",
                                    padding: 4,
                                }}
                                role="list"
                                aria-label="Avatar options"
                            >
                                {AVATAR_LIST.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`Avatar option ${i + 1}`}
                                        role="listitem"
                                        onClick={() => !avatarSaving && handleAvatarChange(url)}
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && !avatarSaving && handleAvatarChange(url)}
                                        style={{
                                            width: "100%", aspectRatio: "1", borderRadius: "50%",
                                            cursor: avatarSaving ? "not-allowed" : "pointer",
                                            border: user?.photoURL === url ? "3px solid var(--accent)" : "3px solid transparent",
                                            transition: "transform 0.15s, border-color 0.15s",
                                            opacity: avatarSaving ? 0.5 : 1,
                                        }}
                                        onMouseEnter={(e) => { if (!avatarSaving) e.target.style.transform = "scale(1.08)"; }}
                                        onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; }}
                                    />
                                ))}
                            </div>
                            {avatarSaving && (
                                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 12 }}>Saving…</p>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
