import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function whatsappLink(number) {
  let digits = String(number || "").replace(/\D/g, "");

  // Nigerian numbers written as 0801... become 234801...
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;

  return `https://wa.me/${digits}`;
}

// The owner sees every consultation request here.
function AdminConsultations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const { data, error: loadError } = await supabase
      .from("consultations")
      .select("*")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(
        "Couldn't load consultations. Make sure the Supabase setup (SQL) has been run."
      );
    } else {
      setItems(data || []);
      setError("");
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleStatus(item) {
    const next = item.status === "contacted" ? "new" : "contacted";

    const { error: updateError } = await supabase
      .from("consultations")
      .update({ status: next })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await load();
  }

  async function remove(item) {
    if (!window.confirm(`Delete the request from ${item.full_name}?`)) return;

    const { error: deleteError } = await supabase
      .from("consultations")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await load();
  }

  const newCount = items.filter((item) => item.status !== "contacted").length;

  return (
    <section id="consultations" className="admin-panel">

      <div className="panel-heading inventory-heading">
        <div>
          <p className="admin-eyebrow">CLIENT REQUESTS</p>
          <h2>Consultations</h2>
          <p>People who asked to book a consultation.</p>
        </div>

        <span className="inventory-count">{newCount} NEW</span>
      </div>

      {error && (
        <p className="admin-message admin-message-error" style={{ marginTop: 20 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="inventory-empty">Loading...</p>
      ) : items.length === 0 ? (
        <p className="inventory-empty">No consultation requests yet.</p>
      ) : (
        <div className="admin-list">
          {items.map((item) => (
            <article
              className={`admin-list-item ${item.status === "contacted" ? "done" : ""}`}
              key={item.id}
            >
              <div className="admin-list-top">
                <strong>{item.full_name}</strong>
                <span className="admin-list-date">{formatDate(item.created_at)}</span>
              </div>

              <p className="admin-list-line">
                <a href={whatsappLink(item.whatsapp)} target="_blank" rel="noopener noreferrer">
                  {item.whatsapp}
                </a>
                {item.email ? ` · ${item.email}` : ""}
              </p>

              <p className="admin-list-line">
                {item.consultation_type} · {item.preferred_time}
                {item.preferred_date ? ` · ${item.preferred_date}` : ""}
              </p>

              {item.notes && <p className="admin-list-notes">“{item.notes}”</p>}

              <div className="inventory-actions admin-list-actions">
                <a
                  className="inventory-toggle admin-link-button"
                  href={whatsappLink(item.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>

                <button
                  type="button"
                  className="inventory-toggle"
                  onClick={() => toggleStatus(item)}
                >
                  {item.status === "contacted" ? "Mark as new" : "Mark as contacted"}
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

export default AdminConsultations;
