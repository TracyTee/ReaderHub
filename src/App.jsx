import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Search from "./pages/Search";
import MyList from "./pages/MyList";
import Profile from "./pages/Profile";
import Events from "./pages/Events";    
import "./styles.css";

// Scroll to top on route change
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

// Protect routes — redirect to /auth if not logged in
function PrivateRoute({ children }) {
    const { user } = useAuth();
    if (user === undefined) {
        // Still loading auth state
        return <div className="spinner" style={{ marginTop: 80 }} role="status" aria-label="Loading" />;
    }
    if (!user) return <Navigate to="/auth" replace />;
    return children;
}

function AppShell() {
    const { user } = useAuth();

    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
                <Route
                    path="/*"
                    element={
                        <PrivateRoute>
                            <Navbar />
                            <ErrorBoundary>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/events" element={<Events />} />
                                    <Route path="/search" element={<Search />} />
                                    <Route path="/list" element={<MyList />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </ErrorBoundary>
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppShell />
        </AuthProvider>
    );
}
