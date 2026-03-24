// BookCard — displays a book thumbnail, title, and author.
// Used in Search results and the Home dashboard.

export default function BookCard({ book, onClick }) {
    const vol = book.volumeInfo || {};
    const googleThumb = vol.imageLinks?.thumbnail?.replace("http://", "https://");

    // Try Google thumbnail first, then Open Library cover if we have an ISBN
    const isbn = (vol.industryIdentifiers || []).find(
        (id) => id.type === "ISBN_13" || id.type === "ISBN_10"
    )?.identifier;
    const cover = googleThumb || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null);
    // 
    return (
        <article
            className="book-card"
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-label={`${vol.title || "Unknown title"} by ${(vol.authors || []).join(", ") || "Unknown author"}`}
            onKeyDown={(e) => e.key === "Enter" && onClick?.()}
        >
            {cover ? (
                <img
                    className="book-card-cover"
                    src={cover}
                    alt={`Cover of ${vol.title}`}
                    loading="lazy"
                    onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "grid";
                    }}
                />
            ) : null}
            <div
                className="book-card-cover-placeholder"
                style={{ display: cover ? "none" : "grid" }}
                aria-hidden="true"
            >
            </div>
            <div className="book-card-info">
                <div className="book-card-title">{vol.title || "Unknown Title"}</div>
                <div className="book-card-author">
                    {(vol.authors || []).slice(0, 2).join(", ") || "Unknown Author"}
                </div>
            </div>
        </article>
    );
}
