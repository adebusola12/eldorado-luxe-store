import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { displayName } from "./useCustomer";

const INITIAL_COUNT = 6;

function Stars({ value }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? "star on" : "star"}>
          ★
        </span>
      ))}
    </span>
  );
}

// Customer reviews. Anyone can read them; customers must be signed in to
// write one. New reviews appear straight away (the owner can hide or delete
// any review in the admin).
function ReviewsSection({ customer, pieceOptions }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const [rating, setRating] = useState(5);
  const [piece, setPiece] = useState("");
  const [location, setLocation] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function loadReviews() {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (!error) setReviews(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function submitReview(event) {
    event.preventDefault();

    if (comment.trim().length < 10) {
      setMessage({
        type: "error",
        text: "Please tell us a little more (at least 10 characters).",
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase.from("reviews").insert([
      {
        reviewer_name: displayName(customer.user),
        location: location.trim(),
        rating,
        piece,
        comment: comment.trim(),
      },
    ]);

    setSaving(false);

    if (error) {
      setMessage({
        type: "error",
        text: "We couldn't post your review. Please try again.",
      });
      return;
    }

    setComment("");
    setLocation("");
    setPiece("");
    setRating(5);
    setMessage({ type: "success", text: "Thank you! Your review is now live." });

    await loadReviews();
  }

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const visibleReviews = showAll ? reviews : reviews.slice(0, INITIAL_COUNT);

  return (
    <section className="reviews-section" id="reviews">

      <div className="section-heading">
        <p className="eyebrow">IN THEIR WORDS</p>
        <h2>
          Worn with <em>pride.</em>
        </h2>
        <p>What our customers say about their ELDORADO LUXE outfits.</p>
      </div>

      {reviews.length > 0 && (
        <div className="reviews-summary">
          <strong>{average.toFixed(1)}</strong>
          <Stars value={Math.round(average)} />
          <span>
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {loading ? (
        <p className="section-note">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="section-note">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <>
          <div className="reviews-grid">
            {visibleReviews.map((review) => (
              <article className="review-card" key={review.id}>
                <Stars value={review.rating} />

                <p className="review-text">“{review.comment}”</p>

                <div className="review-meta">
                  <strong>{review.reviewer_name}</strong>
                  {review.location && <span>{review.location}</span>}
                  {review.piece && <span>Bought: {review.piece}</span>}
                </div>
              </article>
            ))}
          </div>

          {reviews.length > INITIAL_COUNT && (
            <div className="view-all-wrap">
              <button
                type="button"
                className="view-all-button"
                onClick={() => setShowAll((current) => !current)}
              >
                {showAll ? "SHOW LESS" : `READ ALL (${reviews.length})`}
                <span>{showAll ? "↑" : "→"}</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* WRITE A REVIEW */}
      <div className="review-form-wrap">
        <h3>Write a review</h3>

        {!customer.ready ? null : !customer.user ? (
          <p className="review-login-note">
            Please <a href="#/account">create an account or sign in</a> to leave
            a review.
          </p>
        ) : (
          <form className="review-form" onSubmit={submitReview}>

            <div className="form-row">
              <span className="form-label">Your rating</span>

              <div className="star-picker" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                    className={star <= rating ? "star-button on" : "star-button"}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-two">
              <label className="form-field">
                <span className="form-label">Outfit (optional)</span>
                <select value={piece} onChange={(e) => setPiece(e.target.value)}>
                  <option value="">Choose a collection</option>
                  {pieceOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="form-label">Location (optional)</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lagos"
                  maxLength={60}
                />
              </label>
            </div>

            <label className="form-field">
              <span className="form-label">Your review</span>
              <textarea
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about the fit, the fabric and how you felt wearing it."
                maxLength={800}
              />
            </label>

            {message.text && (
              <p className={`form-message ${message.type}`} role="status">
                {message.text}
              </p>
            )}

            <button className="dark-button form-submit" type="submit" disabled={saving}>
              {saving ? "POSTING..." : "POST REVIEW"}
            </button>

          </form>
        )}
      </div>

    </section>
  );
}

export default ReviewsSection;