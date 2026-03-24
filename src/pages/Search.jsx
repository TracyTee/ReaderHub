import { useState } from "react";
import BookCard from "../components/BookCard";
import BookModal from "../components/BookModal";
import ErrorBoundary from "../components/ErrorBoundary";

// 🔑 Uses env variable — make sure VITE_GOOGLE_BOOKS_API_KEY is set in your .env
const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

const SEARCH_TYPES = [
    { key: "all", label: "All", prefix: "" },
    { key: "title", label: "Title", prefix: "intitle:" },
    { key: "author", label: "Author", prefix: "inauthor:" },
    { key: "isbn", label: "ISBN", prefix: "isbn:" },
    { key: "genre", label: "Genre", prefix: "subject:" },
];

const SORT_OPTIONS = [
    { key: "relevance", label: "Relevance" },
    { key: "newest", label: "Newest" },
];

const PLACEHOLDERS = {
    all: "Search by title, author, ISBN, or genre…",
    title: "Enter a book title…",
    author: "Enter an author name…",
    isbn: "Enter an ISBN (e.g. 9780747532743)…",
    genre: "Enter a genre (e.g. Science Fiction)…",
};

function buildQuery(query, searchType) {
    const trimmed = query.trim();
    const type = SEARCH_TYPES.find((t) => t.key === searchType);
    return type?.prefix ? `${type.prefix}${trimmed}` : trimmed;
}

export default function Search() {
    const [query, setQuery] = useState("");
    const [searchType, setSearchType] = useState("all");
    const [sortOrder, setSortOrder] = useState("relevance");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [lastQuery, setLastQuery] = useState("");
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);

    const runSearch = async (overrideSort) => {
        const q = query.trim();
        if (!q) return;

        setLoading(true);
        setSearched(true);
        setError("");
        setResults([]);
        setLastQuery(q);

        const sort = overrideSort || sortOrder;

        try {
            const url = new URL("https://www.googleapis.com/books/v1/volumes");
            url.searchParams.set("q", buildQuery(q, searchType));
            url.searchParams.set("maxResults", "20");
            url.searchParams.set("orderBy", sort);
            url.searchParams.set("key", GOOGLE_BOOKS_API_KEY);

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            setResults(data.items || []);
        } catch (err) {
            setError("Failed to fetch books. Please check your API key or try again later.");
            console.error("Search error:", err);
        }

        setLoading(false);
    };

    const handleSortChange = (key) => {
        setSortOrder(key);
        if (searched && query.trim()) runSearch(key);
    };

    return (
        <div className="page-bg">
            <main className="page fade-up" aria-label="Discover books">
                <header>
                    <h1 className="page-title">Discover Books</h1>
                    <p className="page-sub">Search millions of titles from Google Books</p>
                </header>

                {/* Search type toggles */}
                <div className="filters" role="group" aria-label="Search by" style={{ marginBottom: 12 }}>
                    {SEARCH_TYPES.map((t) => (
                        <button
                            key={t.key}
                            className={`filter-btn ${searchType === t.key ? "active" : ""}`}
                            onClick={() => setSearchType(t.key)}
                            aria-pressed={searchType === t.key}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Search bar */}
                <div className="search-bar" role="search">
                    <input
                        id="book-search"
                        type="search"
                        className="search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && runSearch()}
                        placeholder={PLACEHOLDERS[searchType]}
                        aria-label={`Search by ${SEARCH_TYPES.find((t) => t.key === searchType)?.label}`}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => runSearch()}
                        disabled={loading || !query.trim()}
                        aria-label="Search"
                    >
                        {loading ? "Searching…" : "Search"}
                    </button>
                </div>

                {/* Results count + sort */}
                {searched && !loading && results.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                            {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                            <strong style={{ color: "var(--text)" }}>"{lastQuery}"</strong>
                        </p>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }} role="group" aria-label="Sort results">
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sort:</span>
                            {SORT_OPTIONS.map((s) => (
                                <button
                                    key={s.key}
                                    className={`filter-btn ${sortOrder === s.key ? "active" : ""}`}
                                    style={{ padding: "5px 12px", fontSize: 12 }}
                                    onClick={() => handleSortChange(s.key)}
                                    aria-pressed={sortOrder === s.key}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="alert alert-error" role="alert" style={{ marginBottom: 24 }}>{error}</div>
                )}

                {/* No results */}
                {searched && !loading && !error && results.length === 0 && (
                    <div className="empty-state" aria-live="polite">
                        <div className="empty-state-icon" aria-hidden="true">🔍</div>
                        <p className="empty-state-text">
                            No results for "{lastQuery}".{" "}
                            {searchType !== "all" ? "Try switching to All or " : "Try "}
                            a different term.
                        </p>
                    </div>
                )}

                {/* Results grid */}
                <ErrorBoundary>
                    <section aria-label="Search results" aria-live="polite">
                        {loading ? (
                            <div className="spinner" role="status" aria-label="Searching…" />
                        ) : (
                            <div className="books-grid">
                                {results.map((book) => (
                                    <BookCard key={book.id} book={book} onClick={() => setSelected(book)} />
                                ))}
                            </div>
                        )}
                    </section>
                </ErrorBoundary>

                {selected && (
                    <BookModal book={selected} onClose={() => setSelected(null)} onListChange={() => { }} />
                )}
            </main>
        </div>
    );
}
