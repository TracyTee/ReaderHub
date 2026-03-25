import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(undefined); // undefined = loading
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser ?? null);
            if (firebaseUser) {
                const snap = await getDoc(doc(db, "users", firebaseUser.uid));
                setProfile(snap.exists() ? snap.data() : null);
            } else {
                setProfile(null);
            }
        });
        return unsub;
    }, []);
    
    // ── Global Theme Sync ──
    // This ensures that as soon as the profile is loaded (or cleared), 
    // the theme matches the current state.
    useEffect(() => {
        const activeTheme = profile?.theme || "light";
        document.documentElement.setAttribute("data-theme", activeTheme);
    }, [profile]);

    const refreshProfile = async () => {
        if (!user) return;
        const snap = await getDoc(doc(db, "users", user.uid));
        setProfile(snap.exists() ? snap.data() : null);
    };

    // Reset theme to light immediately on logout to prevent 
    // the next user from seeing the previous theme.
    const logout = async () => {
        await signOut(auth);
        document.documentElement.setAttribute("data-theme", "light");
    };

    return (
        <AuthContext.Provider value={{ user, profile, refreshProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
