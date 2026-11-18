import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const INITIAL_COUNT = 6;

// Photos and videos of outfits the owner made himself.
function GallerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [openImage, setOpenImage] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (!error) setItems(data || []);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!openImage) return;

    function onKey(event) {
      if (event.key === "Escape") setOpenImage(null);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openImage]);

  const visibleItems = showAll ? items : items.slice(0, INITIAL_COUNT);

  return (
    <section className="gallery-section" id="gallery">

      <div className="section-heading">
        <p className="eyebrow">FROM OUR STUDIO</p>
        <h2>
          Made by <em>our hands.</em>
        </h2>
        <p>Photos and videos of outfits we have made ourselves.</p>
      </div>

      {loading ? (
        <p className="section-note">Loading the gallery...</p>
      ) : items.length === 0 ? (
        <p className="section-note">
          New work is on its way. Please check back soon.
        </p>
      ) : (
        <>
          <div className="gallery-grid">
            {visibleItems.map((item) => (
              <figure className="gallery-item" key={item.id}>

                {item.media_type === "video" ? (
                  <video
                    src={item.media_url}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <button
                    type="button"
                    className="gallery-photo-button"
                    onClick={() => setOpenImage(item)}
                    aria-label={`View photo${item.caption ? `: ${item.caption}` : ""}`}
                  >
                    <img
                      src={item.media_url}
                      alt={item.caption || "Outfit made by ELDORADO LUXE"}
                      loading="lazy"
                    />
                  </button>
                )}

                {item.caption && <figcaption>{item.caption}</figcaption>}

              </figure>
            ))}
          </div>

          {items.length > INITIAL_COUNT && (
            <div className="view-all-wrap">
              <button
                type="button"
                className="view-all-button"
                onClick={() => setShowAll((current) => !current)}
              >
                {showAll ? "SHOW LESS" : `VIEW ALL (${items.length})`}
                <span>{showAll ? "↑" : "→"}</span>
              </button>
            </div>
          )}
        </>
      )}

      {openImage && (
        <div
          className="lightbox"
          role="dialog"
          aria-label="Photo"
          onClick={() => setOpenImage(null)}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setOpenImage(null)}
            aria-label="Close photo"
          >
            ×
          </button>

          <img
            src={openImage.media_url}
            alt={openImage.caption || "Outfit made by ELDORADO LUXE"}
            onClick={(event) => event.stopPropagation()}
          />

          {openImage.caption && <p>{openImage.caption}</p>}
        </div>
      )}

    </section>
  );
}

export default GallerySection;