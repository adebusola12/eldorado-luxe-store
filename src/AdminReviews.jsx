import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// The owner can hide or delete any customer review.
function AdminReviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const { data, error: loadError } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError("Couldn't load reviews. Make sure the Supabase setup (SQL) has been run.");
    } else {
      setItems(data || []);
      setError("");
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleVisible(item) {
    const { error: updateError } = await supabase
      .from("reviews")
      .update({ is_visible: !item.is_visible })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await load();
  }

  async function remove(item) {
    if (!window.confirm(`Delete the review from ${item.reviewer_name}?`)) return;

    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await load();
  }

  return (
    <section id="reviews-admin" className="admin-panel">

      <div className="panel-heading inventory-heading">
        <div>
          <p className="admin-eyebrow">WHAT CUSTOMERS SAY</p>
          <h2>Customer reviews</h2>
          <p>Reviews go live straight away. Hide or delete any you don't want shown.</p>
        </div>

        <span className="inventory-count">{items.length} REVIEWS</span>
      </div>

      {error && (
        <p className="admin-message admin-message-error" style={{ marginTop: 20 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="inventory-empty">Loading...</p>
      ) : items.length === 0 ? (
        <p className="inventory-empty">No reviews yet.</p>
      ) : (
        <div className="admin-list">
          {items.map((item) => (
            <article
              className={`admin-list-item ${item.is_visible ? "" : "done"}`}
              key={item.id}
            >
              <div className="admin-list-top">
                <strong>{item.reviewer_name}</strong>
                <span className="admin-list-stars" aria-label={`${item.rating} out of 5`}>
                  {"★".repeat(item.rating)}
                  <span>{"★".repeat(5 - item.rating)}</span>
                </span>
              </div>

              <p className="admin-list-line">
                {[item.location, item.piece].filter(Boolean).join(" · ") || "—"}
                {item.is_visible ? "" : " · HIDDEN"}
              </p>

              <p className="admin-list-notes">“{item.comment}”</p>

              <div className="inventory-actions admin-list-actions">
                <button
                  type="button"
                  className="inventory-toggle"
                  onClick={() => toggleVisible(item)}
                >
                  {item.is_visible ? "Hide" : "Show"}
                </button>

                <button
                  type="button"
                  className="inventory-delete"
                  onClick={() => remove(item)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

    </section>
  );
}

export default AdminReviews;
