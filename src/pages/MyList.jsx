import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BookModal from "../components/BookModal";
import ErrorBoundary from "../components/ErrorBoundary";


const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

const STATUS_OPTIONS = ["not-started", "reading", "finished"];
const STATUS_LABELS = { "not-started": "Not Started", reading: "Reading", finished: "Finished" };
const STATUS_CLASS = { "not-started": "status-not-started", reading: "status-reading", finished: "status-finished" };

const FILTERS = [
    { key: "all", label: "All" },
    { key: "reading", label: "Reading" },
    { key: "not-started", label: "○ Not Started" },
    { key: "finished", label: "✓ Finished" },
];

export default function MyList() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState(null);
    const [fetchingBook, setFetchingBook] = useState(false);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const snap = await getDocs(collection(db, "users", user.uid, "reading_list"));
            setBooks(snap.docs.map((d) => d.data()));
        } catch {
            setError("Could not load your reading list. Please try again.");
        }
        setLoading(false);
    }, [user.uid]);

    useEffect(() => { loadList(); }, [loadList]);

    const handleStatusChange = async (e, bookId) => {
        e.stopPropagation();
        const next = e.target.value;
        setBooks((prev) => prev.map((b) => b.bookId === bookId ? { ...b, status: next } : b));
        try {
            await updateDoc(doc(db, "users", user.uid, "reading_list", bookId), { status: next });
        } catch {
            setError("Failed to update status. Please try again.");
            loadList();
        }
    };

    const handleDelete = async (e, bookId) => {
        e.stopPropagation();
        setBooks((prev) => prev.filter((b) => b.bookId !== bookId));
        try {
            await deleteDoc(doc(db, "users", user.uid, "reading_list", bookId));
        } catch {
            setError("Failed to remove book. Please try again.");
            loadList();
        }
    };

    const openBook = async (bookId) => {
        setFetchingBook(true);
        setError("");
        try {
            const res = await fetch(
                `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`
            );
            if (!res.ok) throw new Error("Failed to fetch book");
            const data = await res.json();
            setSelected(data);
        } catch {
            setError("Could not load book details. Please try again.");
        }
        setFetchingBook(false);
    };

    const filtered = filter === "all" ? books : books.filter((b) => b.status === filter);

    const counts = books.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="page-bg">
            <main className="page fade-up" aria-label="My reading list">
                <header>
                    <h1 className="page-title">My Reading List</h1>
                    <p className="page-sub">
                        {books.length} book{books.length !== 1 ? "s" : ""} total
                        {counts.reading ? ` · ${counts.reading} reading` : ""}
                        {counts.finished ? ` · ${counts.finished} finished` : ""}
                    </p>
                </header>

                {error && <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>{error}</div>}

                {/* Filters */}
                <nav className="filters" aria-label="Filter reading list">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            className={`filter-btn ${filter === f.key ? "active" : ""}`}
                            onClick={() => setFilter(f.key)}
                            aria-pressed={filter === f.key}
                        >
                            {f.label}
                            {f.key !== "all" && counts[f.key] ? (
                                <span style={{ marginLeft: 5, opacity: 0.6 }}>({counts[f.key]})</span>
                            ) : null}
                        </button>
                    ))}
                </nav>

                {loading ? (
                    <div className="spinner" role="status" aria-label="Loading reading list" />
                ) : filtered.length === 0 ? (
                    <div className="empty-state" aria-live="polite">
                        <div className="empty-state-icon" aria-hidden="true">
                            {filter === "all" ? "All" : filter === "finished" ? "Done" : "Reading"}
                        </div>
                        <p className="empty-state-text">
                            {filter === "all"
                                ? "Your list is empty. Start by discovering books!"
                                : `No ${STATUS_LABELS[filter].toLowerCase()} books yet.`}
                        </p>
                        {filter === "all" && (
                            <button className="btn btn-primary btn-sm" onClick={() => navigate("/search")}>
                                Discover books
                            </button>
                        )}
                    </div>
                ) : (
                    <ErrorBoundary>
                        <ul className="reading-list" aria-label="Books in your list">
                            {filtered.map((b) => (
                                <li
                                    key={b.bookId}
                                    className="list-item"
                                    onClick={() => openBook(b.bookId)}
                                    aria-label={`${b.title} — ${STATUS_LABELS[b.status]}`}
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && openBook(b.bookId)}
                                >
                                    {b.thumbnail ? (
                                        <img className="list-thumb" src={b.thumbnail} alt={`Cover of ${b.title}`} loading="lazy" />
                                    ) : (
                                        <div className="list-thumb-placeholder" aria-hidden="true"></div>
                                    )}
                                    <div className="list-info">
                                        <div className="list-title">{b.title}</div>
                                        <div className="list-author">{(b.authors || []).join(", ")}</div>
                                        {b.rating > 0 && (
                                            <div style={{ fontSize: 12, color: "var(--amber)", marginTop: 3 }} aria-label={`Rated ${b.rating} stars`}>
                                                {"★".repeat(b.rating)}{"☆".repeat(5 - b.rating)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="list-actions" onClick={(e) => e.stopPropagation()}>
                                        <select
                                            className={`status-select ${STATUS_CLASS[b.status]}`}
                                            value={b.status}
                                            onChange={(e) => handleStatusChange(e, b.bookId)}
                                            aria-label={`Status for ${b.title}`}
                                        >
                                            {STATUS_OPTIONS.map((s) => (
                                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                            ))}
                                        </select>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={(e) => handleDelete(e, b.bookId)}
                                            aria-label={`Remove ${b.title} from list`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ErrorBoundary>
                )}

                {fetchingBook && <div className="spinner" role="status" aria-label="Loading book details" />}

                {selected && (
                    <BookModal
                        book={selected}
                        onClose={() => setSelected(null)}
                        onListChange={loadList}
                    />
                )}
            </main>
        </div>
    );
}
