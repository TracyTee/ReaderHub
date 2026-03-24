import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    const initial = (profile?.displayName || user?.email || "?")[0].toUpperCase();

    const handleLogout = async () => {
        await logout();
        navigate("/auth");
    };

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <NavLink to="/" className="navbar-brand" aria-label="ReaderHub home">
                <div className="navbar-brand-icon" aria-hidden="true"></div>
                <span className="navbar-brand-name">ReaderHub</span>
            </NavLink>

            <div className="navbar-links">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="Home dashboard"
                >
                    Home
                </NavLink>
                <NavLink
                    to="/search"
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="Search books"
                >
                    Discover
                </NavLink>
                <NavLink
                    to="/list"
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="My reading list"
                >
                    My List
                </NavLink>
                <NavLink
                    to="/profile"
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="My profile"
                >
                    Profile
                </NavLink>
            </div>

            <div className="navbar-right">
                <div
                    className="nav-avatar"
                    aria-label={`Logged in as ${profile?.displayName || user?.email}`}
                    title={profile?.displayName || user?.email}
                    onClick={() => navigate("/profile")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate("/profile")}
                >
                    {initial}
                </div>
                <button className="nav-btn" onClick={handleLogout} aria-label="Sign out">
                    Sign out
                </button>
            </div>
        </nav>
    );
}
