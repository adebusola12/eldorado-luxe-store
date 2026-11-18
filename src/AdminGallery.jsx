import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadToCloudinary } from "./cloudinaryUpload";

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

// Owner posts photos and videos of outfits he made himself.
function AdminGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [preview, setPreview] = useState("");
  const fileInput = useRef(null);

  async function load() {
    const { data, error } = await supabase
      .from("gallery_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage({
        type: "error",
        text: "Couldn't load the gallery. Make sure the Supabase setup (SQL) has been run.",
      });
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function addItem(event) {
    event.preventDefault();

    if (!file) {
      setMessage({ type: "error", text: "Please choose a photo or video first." });
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setMessage({ type: "error", text: "Please choose a photo or a video file." });
      return;
    }

    const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;

    if (file.size > maxMb * 1024 * 1024) {
      setMessage({
        type: "error",
        text: `That ${isVideo ? "video" : "photo"} is too large. Please keep it under ${maxMb} MB.`,
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const url = await uploadToCloudinary(file, isVideo ? "video" : "image");

      const { error } = await supabase.from("gallery_items").insert([
        {
          media_type: isVideo ? "video" : "image",
          media_url: url,
          caption: caption.trim(),
          is_active: true,
        },
      ]);

      if (error) throw error;

      setFile(null);
      setCaption("");
      if (fileInput.current) fileInput.current.value = "";

      setMessage({
        type: "success",
        text: `${isVideo ? "Video" : "Photo"} added to the gallery.`,
      });

      await load();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Upload failed. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleItem(item) {
    const { error } = await supabase
      .from("gallery_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    await load();
  }

  async function deleteItem(item) {
    if (!window.confirm("Remove this from the gallery?")) return;

    const { error } = await supabase
      .from("gallery_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    await load();
  }

  return (
    <section id="gallery-admin" className="admin-panel">

      <div className="panel-heading inventory-heading">
        <div>
          <p className="admin-eyebrow">YOUR OWN WORK</p>
          <h2>Gallery</h2>
          <p>Post photos and videos of outfits you have made yourself.</p>
        </div>

        <span className="inventory-count">{items.length} ITEMS</span>
      </div>

      <form className="admin-product-form" onSubmit={addItem}>
        <div className="form-grid">

          <div className="admin-field full-width">
            <label htmlFor="gallery-file">Photo or video</label>

            <div className="admin-media-preview">
              {preview ? (
                file?.type.startsWith("video/") ? (
                  <video src={preview} controls muted playsInline />
                ) : (
                  <img src={preview} alt="Preview" />
                )
              ) : (
                <span>Nothing chosen yet</span>
              )}

              <input
                id="gallery-file"
                ref={fileInput}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </div>

            <small className="selected-file">
              Photos up to {MAX_IMAGE_MB} MB, videos up to {MAX_VIDEO_MB} MB.
            </small>
          </div>

          <div className="admin-field full-width">
            <label htmlFor="gallery-caption">Caption (optional)</label>
            <input
              id="gallery-caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Wine Agbada made for a wedding in Lagos"
              maxLength={120}
            />
          </div>

        </div>

        {message.text && (
          <p
            className={`admin-message admin-message-${message.type === "error" ? "error" : "success"}`}
            role="status"
            style={{ marginTop: 20 }}
          >
            {message.text}
          </p>
        )}

        <div className="form-footer">
          <p>
            Large videos can take a minute to upload. Please keep this page open.
          </p>

          <button type="submit" className="admin-primary-button" disabled={saving}>
            {saving ? "UPLOADING..." : "POST TO GALLERY"}
            <span>→</span>
          </button>
        </div>
      </form>

      {loading ? (
        <p className="inventory-empty">Loading...</p>
      ) : items.length === 0 ? (
        <p className="inventory-empty">
          Nothing posted yet. Your photos and videos will appear here.
        </p>
      ) : (
        <div className="admin-gallery-grid">
          {items.map((item) => (
            <article className="admin-gallery-item" key={item.id}>

              <div className="admin-gallery-media">
                {item.media_type === "video" ? (
                  <video src={item.media_url} controls muted playsInline preload="metadata" />
                ) : (
                  <img src={item.media_url} alt={item.caption || "Gallery item"} loading="lazy" />
                )}

                <span
                  className={`product-status ${item.is_active ? "published" : "hidden"}`}
                >
                  {item.is_active ? "SHOWING" : "HIDDEN"}
                </span>
              </div>

              <div className="admin-gallery-body">
                <p>{item.caption || "No caption"}</p>

                <div className="inventory-actions">
                  <button
                    type="button"
                    className="inventory-toggle"
                    onClick={() => toggleItem(item)}
                  >
                    {item.is_active ? "Hide" : "Show"}
                  </button>

                  <button
                    type="button"
                    className="inventory-delete"
                    onClick={() => deleteItem(item)}
                  >
                    Delete
                  </button>
                </div>
              </div>

            </article>
          ))}
        </div>
      )}

    </section>
  );
}

export default AdminGallery;