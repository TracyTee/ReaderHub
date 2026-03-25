/** BookModal component — shows detailed info about a book
 * Allows user to add it to their reading list, set status, and write a review.
 * Opens when a BookCard is clicked. Fetches saved data from Firestore to show current status, rating, and review if the book is already in the user's list.
 * User can change reading status with a dropdown, and write/edit a review with a star rating and text area. 
 * Changes are saved to Firestore.
 */
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = ["not-started", "reading", "finished"];
const STATUS_LABELS = { "not-started": "Not Started", reading: "Reading", finished: "Finished" };
const STATUS_CLASS = { "not-started": "status-not-started", reading: "status-reading", finished: "status-finished" };

function stripHtml(html) {
    const d = document.createElement("div");
    d.innerHTML = html || "";
    return d.textContent || "";
}

export default function BookModal({ book, onClose, onListChange }) {
    const { user } = useAuth();
    const vol = book.volumeInfo || {};

    // Get thumbnail: try Google first, then Open Library fallback using ISBN
    const googleThumb = vol.imageLinks?.thumbnail?.replace("http://", "https://");
    const isbn = (vol.industryIdentifiers || []).find(
        (id) => id.type === "ISBN_13" || id.type === "ISBN_10"
    )?.identifier;
    const cover = googleThumb || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null);

    const [saved, setSaved] = useState(false);
    const [status, setStatus] = useState("not-started");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState("");
    const [savedReview, setSavedReview] = useState(null);
    const [editReview, setEditReview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState("");

    const ref = doc(db, "users", user.uid, "reading_list", book.id);

    useEffect(() => {
        getDoc(ref).then((snap) => {
            if (snap.exists()) {
                const d = snap.data();
                setSaved(true);
                setStatus(d.status || "not-started");
                if (d.rating) { setRating(d.rating); setReview(d.review || ""); }
                if (d.review) setSavedReview(d.review);
            }
        }).catch(() => setApiError("Could not load book data."));
    }, []);

    const handleAdd = async () => {
        setSaving(true);
        setApiError("");
        try {
            await setDoc(ref, {
                bookId: book.id,
                title: vol.title || "Unknown",
                authors: vol.authors || [],
                thumbnail: cover || "",
                status: "not-started",
                rating: 0,
                review: "",
                addedAt: new Date().toISOString(),
            });
            setSaved(true);
            setStatus("not-started");
            onListChange?.();
        } catch {
            setApiError("Failed to add book. Please try again.");
        }
        setSaving(false);
    };

    const handleRemove = async () => {
        try {
            await deleteDoc(ref);
            setSaved(false);
            setStatus("not-started");
            setRating(0);
            setSavedReview(null);
            onListChange?.();
        } catch {
            setApiError("Failed to remove book. Please try again.");
        }
    };

    const handleStatusChange = async (e) => {
        const next = e.target.value;
        setStatus(next);
        try {
            await updateDoc(ref, { status: next });
            onListChange?.();
        } catch {
            setApiError("Failed to update status.");
        }
    };

    const handleSaveReview = async () => {
        if (!rating) return;
        try {
            await updateDoc(ref, { rating, review });
            setSavedReview(review);
            setEditReview(false);
        } catch {
            setApiError("Failed to save review.");
        }
    };

    const description = stripHtml(vol.description || "").slice(0, 600);

    return (
        <div
            className="modal-overlay fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${vol.title}`}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal fade-up">
                <button className="modal-close" onClick={onClose} aria-label="Close modal">✕</button>

                <div className="modal-header">
                    <div className="modal-cover">
                        {cover ? (
                            <img src={cover} alt={`Cover of ${vol.title}`} />
                        ) : (
                            <div className="modal-cover-placeholder" aria-hidden="true"></div>
                        )}
                    </div>
                    <div className="modal-meta">
                        <h2 className="modal-title">{vol.title || "Unknown Title"}</h2>
                        <div className="modal-author">{(vol.authors || []).join(", ") || "Unknown Author"}</div>
                        {vol.publishedDate && (
                            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>
                                {vol.publishedDate.slice(0, 4)}
                            </div>
                        )}
                        <div className="modal-tags">
                            {(vol.categories || []).slice(0, 2).map((c) => (
                                <span key={c} className="badge badge-blue">{c}</span>
                            ))}
                            {vol.pageCount && <span className="badge badge-dim">{vol.pageCount} pages</span>}
                        </div>
                    </div>
                </div>

                {description && (
                    <p className="modal-desc">
                        {description}{vol.description?.length > 600 ? "…" : ""}
                    </p>
                )}

                {apiError && <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>{apiError}</div>}

                <div className="modal-actions">
                    {!saved ? (
                        <button className="btn btn-primary" onClick={handleAdd} disabled={saving} aria-label="Add to reading list">
                            {saving ? "Adding…" : "＋ Add to Reading List"}
                        </button>
                    ) : (
                        <>
                            <select
                                className={`status-select ${STATUS_CLASS[status]}`}
                                value={status}
                                onChange={handleStatusChange}
                                aria-label="Reading status"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                            <button className="btn btn-danger btn-sm" onClick={handleRemove} aria-label="Remove from reading list">
                                Remove
                            </button>
                        </>
                    )}
                </div>

                {/* Review section — only shown once book is saved */}
                {saved && (
                    <section aria-label="Your review">
                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                            <div className="section-heading" style={{ fontSize: 15 }}>Your Review</div>

                            {savedReview && !editReview ? (
                                <div style={{ background: "var(--bg3)", borderRadius: 10, padding: 14 }}>
                                    <div className="stars" aria-label={`Rated ${rating} out of 5`}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <span key={s} className={`star ${s <= rating ? "filled" : ""}`} aria-hidden="true">★</span>
                                        ))}
                                    </div>
                                    {savedReview && <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>{savedReview}</p>}
                                    <button
                                        style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                        onClick={() => setEditReview(true)}
                                    >
                                        Edit review
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="stars" role="group" aria-label="Star rating">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <span
                                                key={s}
                                                className={`star ${s <= (hoverRating || rating) ? "filled" : ""}`}
                                                onClick={() => setRating(s)}
                                                onMouseEnter={() => setHoverRating(s)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
                                                onKeyDown={(e) => e.key === "Enter" && setRating(s)}
                                            >★</span>
                                        ))}
                                    </div>
                                    <textarea
                                        className="form-textarea"
                                        style={{ marginTop: 10 }}
                                        value={review}
                                        onChange={(e) => setReview(e.target.value)}
                                        placeholder="Write your thoughts… (optional)"
                                        aria-label="Review text"
                                    />
                                    <button
                                        className="btn btn-primary btn-sm"
                                        style={{ marginTop: 10 }}
                                        onClick={handleSaveReview}
                                        disabled={!rating}
                                        aria-label="Save review"
                                    >
                                        Save Review
                                    </button>
                                </>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
