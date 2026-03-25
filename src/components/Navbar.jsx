import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const initial = (profile?.displayName || user?.email || "?")[0].toUpperCase();

    const handleLogout = async () => {
        await logout();
        navigate("/auth");
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
                <div className="navbar-brand-icon" aria-hidden="true"></div>
                <span className="navbar-brand-name">ReaderHub</span>
            </NavLink>

            {/* Hamburger Toggle Button */}
            <button 
                className={`hamburger ${isMenuOpen ? "active" : ""}`} 
                onClick={toggleMenu}
                aria-label="Toggle navigation"
                aria-expanded={isMenuOpen}
            >
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </button>

            <div className={`navbar-links ${isMenuOpen ? "open" : ""}`}>
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="Home dashboard"
                    onClick={closeMenu}
                >
                    Home
                </NavLink>
                <NavLink
                    to="/search"
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="Search books"
                    onClick={closeMenu}
                >
                    Discover
                </NavLink>
                <NavLink
                    to="/list"
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="My reading list"
                    onClick={closeMenu}
                >
                    My List
                </NavLink>
                <NavLink
                    to="/events"
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="Events"
                    onClick={closeMenu}
                >
                    Event Hub
                </NavLink>
                <NavLink
                    to="/profile"
                    className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                    aria-label="My profile"
                    onClick={closeMenu}
                >
                    Profile
                </NavLink>
                
                {/* Mobile-only Sign Out */}
                <button className="nav-btn mobile-only" onClick={handleLogout}>
                    Sign out
                </button>
            </div>

            <div className="navbar-right">
                <div
                    className="nav-avatar"
                    aria-label={`Logged in as ${profile?.displayName || user?.email}`}
                    title={profile?.displayName || user?.email}
                    onClick={() => {navigate("/profile");
                        closeMenu();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate("/profile")}
                >
                    {initial}
                </div>

                {/* Desktop-only Sign Out */}
                <button className="nav-btn  desktop-only" onClick={handleLogout} aria-label="Sign out">
                    Sign out
                </button>
            </div>
        </nav>
    );
}
