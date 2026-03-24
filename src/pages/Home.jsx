import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BookModal from "../components/BookModal";
import ErrorBoundary from "../components/ErrorBoundary";

const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

const QUOTES = [
    { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
    { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
    { text: "It is our choices that show what we truly are, far more than our abilities.", author: "J.K. Rowling" },
    { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "One must always be careful of books, and what is inside them.", author: "Cassandra Clare" },
    { text: "Books are a uniquely portable magic.", author: "Stephen King" },
    { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
    { text: "So many books, so little time.", author: "Frank Zappa" },
    { text: "A room without books is like a body without a soul.", author: "Cicero" },
];

const FEATURED_BOOKS = [
    { id: "feat1", title: "The Women", author: "Kristin Hannah", cover: "https://covers.openlibrary.org/b/id/14421689-L.jpg", rating: 5 },
    { id: "feat2", title: "Fourth Wing", author: "Rebecca Yarros", cover: "https://covers.openlibrary.org/b/id/13880434-L.jpg", rating: 5 },
    { id: "feat3", title: "Yellowface", author: "R.F. Kuang", cover: "https://covers.openlibrary.org/b/id/13596752-L.jpg", rating: 4 },
    { id: "feat4", title: "Atomic Habits", author: "James Clear", cover: "https://covers.openlibrary.org/b/id/12871131-L.jpg", rating: 5 },
    { id: "feat5", title: "The Alchemist", author: "Paulo Coelho", cover: "https://covers.openlibrary.org/b/id/12711693-L.jpg", rating: 4 },
    { id: "feat6", title: "Funny Story", author: "Emily Henry", cover: "https://covers.openlibrary.org/b/id/14481024-L.jpg", rating: 5 },
    { id: "feat7", title: "Iron Flame", author: "Rebecca Yarros", cover: "https://covers.openlibrary.org/b/id/14187313-L.jpg", rating: 4 },
    { id: "feat8", title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", cover: "https://covers.openlibrary.org/b/id/12886018-L.jpg", rating: 5 },
];

// ── Star rating display ────────────────────────────────────────────────────
function StarRating({ rating }) {
    return (
        <div style={{ display: "flex", gap: 2, justifyContent: "center", margin: "6px 0" }} aria-label={`Rated ${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} style={{ color: s <= rating ? "var(--amber)" : "var(--border)", fontSize: 13 }} aria-hidden="true">★</span>
            ))}
        </div>
    );
}

// ── Currently reading section ──────────────────────────────────────────────
function CurrentlyReadingSection({ userId, onBookClick }) {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const q = query(
                    collection(db, "users", userId, "reading_list"),
                    where("status", "==", "reading")
                );
                const snap = await getDocs(q);
                setBooks(snap.docs.map((d) => d.data()));
            } catch {
                setError("Could not load your reading list.");
            }
            setLoading(false);
        };
        load();
    }, [userId]);

    if (loading) return <div className="spinner" role="status" aria-label="Loading" />;
    if (error) return <div className="alert alert-error" role="alert">{error}</div>;

    if (books.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon" aria-hidden="true"></div>
                <p className="empty-state-text">You're not reading anything yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate("/search")}>
                    Find a book
                </button>
            </div>
        );
    }

    return (
        <div className="currently-reading-grid" role="list" aria-label="Currently reading">
            {books.map((b) => (
                <article
                    key={b.bookId}
                    className="currently-card"
                    role="listitem"
                    onClick={() => onBookClick(b.bookId)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onBookClick(b.bookId)}
                    aria-label={`${b.title} by ${(b.authors || []).join(", ")}`}
                >
                    {b.thumbnail ? (
                        <img className="currently-thumb" src={b.thumbnail} alt={`Cover of ${b.title}`} />
                    ) : (
                        <div className="currently-thumb-placeholder" aria-hidden="true"></div>
                    )}
                    <div className="currently-info">
                        <div className="currently-title">{b.title}</div>
                        <div className="currently-author">{(b.authors || []).join(", ")}</div>
                        <span className="badge badge-blue" aria-label="Currently reading">Reading</span>
                    </div>
                </article>
            ))}
        </div>
    );
}

// ── Home page ──────────────────────────────────────────────────────────────
export default function Home() {
    const { profile, user } = useAuth();
    const [selectedBook, setSelectedBook] = useState(null);
    const [fetchError, setFetchError] = useState("");

    // Rotating quote state
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [quoteVisible, setQuoteVisible] = useState(true);

    // Rotate quote every 5 seconds with fade transition
    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteVisible(false);
            setTimeout(() => {
                setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
                setQuoteVisible(true);
            }, 500); // fade out duration
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const openBook = async (bookId) => {
        setFetchError("");
        try {
            const res = await fetch(
                `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`
            );
            if (!res.ok) throw new Error("Failed to fetch book details");
            const data = await res.json();
            setSelectedBook(data);
        } catch {
            setFetchError("Could not load book details. Please try again.");
        }
    };

    // Open a featured book by searching Google Books for it
    const openFeaturedBook = async (title, author) => {
        setFetchError("");
        try {
            const res = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=1&key=${GOOGLE_BOOKS_API_KEY}`
            );
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            if (data.items?.[0]) setSelectedBook(data.items[0]);
        } catch {
            setFetchError("Could not load book details. Please try again.");
        }
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="page-bg">
            <main className="page fade-up" aria-label="Home dashboard">

                {/* Greeting */}
                <header style={{ marginBottom: 36 }}>
                    <h1 className="page-title">
                        {greeting()}, {profile?.displayName?.split(" ")[0] || "reader"}
                    </h1>
                    <p className="page-sub">Here's what's on your reading shelf today.</p>
                </header>

                {fetchError && (
                    <div className="alert alert-error" role="alert" style={{ marginBottom: 24 }}>{fetchError}</div>
                )}

                {/* Currently Reading */}
                <section aria-labelledby="currently-heading" style={{ marginBottom: 40 }}>
                    <div className="section-heading">
                        <h2 id="currently-heading">Currently Reading</h2>
                        <div className="section-heading-line" aria-hidden="true" />
                    </div>
                    <ErrorBoundary>
                        <CurrentlyReadingSection userId={user.uid} onBookClick={openBook} />
                    </ErrorBoundary>
                </section>

                {/* Quote — now rotating with fade */}
                <section aria-labelledby="quote-heading" style={{ marginBottom: 40 }}>
                    <div className="section-heading">
                        <h2 id="quote-heading">Quote of the Day</h2>
                        <div className="section-heading-line" aria-hidden="true" />
                    </div>
                    <blockquote
                        className="quote-card"
                        style={{ transition: "opacity 0.5s ease", opacity: quoteVisible ? 1 : 0 }}
                        aria-live="polite"
                    >
                        <div className="quote-mark" aria-hidden="true">"</div>
                        <p className="quote-text">{QUOTES[quoteIndex].text}</p>
                        <footer className="quote-author">— {QUOTES[quoteIndex].author}</footer>
                    </blockquote>
                </section>

                {/* Featured Books */}
                <section aria-labelledby="featured-heading">
                    <div className="section-heading">
                        <h2 id="featured-heading">Trending Books</h2>
                        <div className="section-heading-line" aria-hidden="true" />
                    </div>
                    <div className="featured-books-grid" role="list" aria-label="Trending books">
                        {FEATURED_BOOKS.map((book) => (
                            <article
                                key={book.id}
                                className="featured-book-card"
                                role="listitem"
                                onClick={() => openFeaturedBook(book.title, book.author)}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && openFeaturedBook(book.title, book.author)}
                                aria-label={`${book.title} by ${book.author}`}
                            >
                                <div className="featured-book-cover">
                                    <img src={book.cover} alt={`Cover of ${book.title}`} loading="lazy" />
                                </div>
                                <StarRating rating={book.rating} />
                                <div className="featured-book-title">{book.title}</div>
                                <div className="featured-book-author">{book.author}</div>
                            </article>
                        ))}
                    </div>
                </section>

                {selectedBook && (
                    <BookModal
                        book={selectedBook}
                        onClose={() => setSelectedBook(null)}
                        onListChange={() => { }}
                    />
                )}
            </main>
        </div>
    );
}
