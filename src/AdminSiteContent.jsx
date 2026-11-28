import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { uploadToCloudinary } from "./cloudinaryUpload";
import { DEFAULT_FOUNDER } from "./siteContent";

// Owner-facing editor for the founder section and each collection's
// description and colours.
function AdminSiteContent({ collections }) {
  const [founder, setFounder] = useState(DEFAULT_FOUNDER);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInput = useRef(null);

  const [tab, setTab] = useState("hero");
  const [coverBusy, setCoverBusy] = useState("");

  // Hero pictures (the big pictures at the top of the home page)
  const [heroImages, setHeroImages] = useState([]);
  const [heroFile, setHeroFile] = useState(null);
  const [savingHero, setSavingHero] = useState(false);
  const heroInput = useRef(null);

  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingFounder, setSavingFounder] = useState(false);
  const [savingCollections, setSavingCollections] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (!mounted) return;

      if (error) {
        setMessage({
          type: "error",
          text: "Couldn't load saved content. Make sure the Supabase setup (SQL) has been run.",
        });
      } else {
        data.forEach((row) => {
          if (row.key === "founder" && row.value) {
            setFounder({ ...DEFAULT_FOUNDER, ...row.value });
          }
          if (row.key === "collections" && row.value) {
            setInfo(row.value);
          }
          if (row.key === "hero" && Array.isArray(row.value?.images)) {
            setHeroImages(row.value.images);
          }
        });
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(founder.image_url || "");
      return;
    }

    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photoFile, founder.image_url]);

  function updateFounder(field, value) {
    setFounder((current) => ({ ...current, [field]: value }));
  }

  async function saveFounder(event) {
    event.preventDefault();
    setSavingFounder(true);
    setMessage({ type: "", text: "" });

    try {
      let imageUrl = founder.image_url || "";

      if (photoFile) {
        if (photoFile.size > 10 * 1024 * 1024) {
          throw new Error("Please choose a photo smaller than 10 MB.");
        }
        imageUrl = await uploadToCloudinary(photoFile, "image");
      }

      const value = { ...founder, image_url: imageUrl };

      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "founder", value, updated_at: new Date().toISOString() });

      if (error) throw error;

      setFounder(value);
      setPhotoFile(null);
      if (photoInput.current) photoInput.current.value = "";

      setMessage({ type: "success", text: "Founder section saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Couldn't save the founder section.",
      });
    } finally {
      setSavingFounder(false);
    }
  }

  async function saveHero(images) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "hero", value: { images }, updated_at: new Date().toISOString() });

    if (error) throw error;
    setHeroImages(images);
  }

  async function addHeroPicture(event) {
    event.preventDefault();
    if (!heroFile) {
      setMessage({ type: "error", text: "Choose a picture first." });
      return;
    }
    if (heroImages.length >= 5) {
      setMessage({ type: "error", text: "You can have up to 5 hero pictures. Remove one first." });
      return;
    }
    if (heroFile.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Please choose a picture smaller than 10 MB." });
      return;
    }

    setSavingHero(true);
    setMessage({ type: "", text: "" });

    try {
      const url = await uploadToCloudinary(heroFile, "image");
      await saveHero([...heroImages, url]);
      setHeroFile(null);
      if (heroInput.current) heroInput.current.value = "";
      setMessage({ type: "success", text: "Hero picture added. It now shows on the home page." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Couldn't add the picture." });
    } finally {
      setSavingHero(false);
    }
  }

  async function removeHeroPicture(index) {
    if (!window.confirm("Remove this hero picture?")) return;

    try {
      await saveHero(heroImages.filter((_, i) => i !== index));
      setMessage({ type: "success", text: "Hero picture removed." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Couldn't remove the picture." });
    }
  }

  function collectionData(name) {
    const entry = info[name] || {};
    const fallback = collections.find((item) => item.name === name);

    return {
      description:
        entry.description !== undefined
          ? entry.description
          : fallback?.description || "",
      colors: Array.isArray(entry.colors) ? entry.colors : [],
      cover: typeof entry.cover === "string" ? entry.cover : "",
      // kept as text while typing, saved as a list
      sizes: Array.isArray(entry.sizes)
        ? entry.sizes.join(", ")
        : typeof entry.sizes === "string"
          ? entry.sizes
          : "",
    };
  }

  function updateCollection(name, changes) {
    setInfo((current) => ({
      ...current,
      [name]: { ...collectionData(name), ...changes },
    }));
  }

  function addColor(name) {
    const { colors } = collectionData(name);
    updateCollection(name, {
      colors: [...colors, { name: "", hex: "#20231f" }],
    });
  }

  function changeColor(name, index, changes) {
    const { colors } = collectionData(name);
    updateCollection(name, {
      colors: colors.map((color, i) =>
        i === index ? { ...color, ...changes } : color
      ),
    });
  }

  function removeColor(name, index) {
    const { colors } = collectionData(name);
    updateCollection(name, { colors: colors.filter((_, i) => i !== index) });
  }

  // Everything about every collection, ready to save.
  // Colour rows left without a name are dropped.
  function buildCollectionsValue(coverOverrides = {}) {
    const value = {};

    collections.forEach((collection) => {
      const data = collectionData(collection.name);

      value[collection.name] = {
        description: data.description.trim(),
        colors: data.colors.filter((color) => color.name.trim()),
        sizes: data.sizes
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean)
          .slice(0, 12),
        cover:
          collection.name in coverOverrides
            ? coverOverrides[collection.name]
            : data.cover,
      };
    });

    return value;
  }

  // Upload (or remove) a collection's cover picture and save it straight away
  async function changeCover(name, file) {
    setMessage({ type: "", text: "" });

    if (file && file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Please choose a picture smaller than 10 MB." });
      return;
    }

    setCoverBusy(name);

    try {
      const url = file ? await uploadToCloudinary(file, "image") : "";
      const value = buildCollectionsValue({ [name]: url });

      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "collections", value, updated_at: new Date().toISOString() });

      if (error) throw error;

      setInfo(value);
      setMessage({
        type: "success",
        text: file ? `${name} cover picture saved.` : `${name} cover picture removed.`,
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Couldn't save the picture." });
    } finally {
      setCoverBusy("");
    }
  }

  async function saveCollections(event) {
    event.preventDefault();
    setSavingCollections(true);
    setMessage({ type: "", text: "" });

    const value = buildCollectionsValue();

    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "collections", value, updated_at: new Date().toISOString() });

    setSavingCollections(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setInfo(value);
    setMessage({ type: "success", text: "Collection details saved." });
  }

  return (
    <section id="site-content" className="admin-panel">

      <div className="panel-heading">
        <div>
          <p className="admin-eyebrow">YOUR WEBSITE TEXT</p>
          <h2>Site content</h2>
          <p>
            Change the hero pictures, the founder section and each collection.
          </p>
        </div>

        <span className="panel-number">02</span>
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

      {loading ? (
        <p className="inventory-empty">Loading...</p>
      ) : (
        <>
          <div className="admin-tabs" role="tablist">
            {[
              ["hero", "Hero pictures"],
              ["founder", "Founder"],
              ["collections", "Collections"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? "admin-tab active" : "admin-tab"}
                onClick={() => {
                  setTab(key);
                  setMessage({ type: "", text: "" });
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* HERO PICTURES */}
          {tab === "hero" && (
            <form className="admin-product-form" onSubmit={addHeroPicture}>
              <h3 className="admin-subheading">Hero pictures</h3>

              <p className="admin-hint">
                These fade one after the other at the top of the home page. Use
                tall photos (portrait) of your best outfits. Up to 5.
              </p>

              {heroImages.length > 0 && (
                <div className="admin-gallery-grid">
                  {heroImages.map((url, index) => (
                    <div className="admin-gallery-item" key={url}>
                      <div className="admin-gallery-media">
                        <img src={url} alt={`Hero ${index + 1}`} />
                      </div>
                      <div className="admin-gallery-body">
                        <div className="inventory-actions">
                          <button
                            type="button"
                            className="inventory-delete"
                            onClick={() => removeHeroPicture(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="admin-media-preview" style={{ marginTop: 22 }}>
                <input
                  ref={heroInput}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHeroFile(e.target.files[0] || null)}
                />
              </div>

              <div className="form-footer">
                <p>
                  {heroImages.length === 0
                    ? "No pictures yet, so the website shows its default picture."
                    : `${heroImages.length} of 5 pictures added.`}
                </p>

                <button type="submit" className="admin-primary-button" disabled={savingHero}>
                  {savingHero ? "UPLOADING..." : "ADD PICTURE"}
                  <span>→</span>
                </button>
              </div>
            </form>
          )}

          {/* FOUNDER */}
          {tab === "founder" && (
          <form className="admin-product-form" onSubmit={saveFounder}>
            <h3 className="admin-subheading">Meet the founder</h3>

            <div className="form-grid">
              <div className="admin-field">
                <label htmlFor="founder-name">Your name</label>
                <input
                  id="founder-name"
                  type="text"
                  value={founder.name}
                  onChange={(e) => updateFounder("name", e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="founder-title">Your title</label>
                <input
                  id="founder-title"
                  type="text"
                  value={founder.title}
                  onChange={(e) => updateFounder("title", e.target.value)}
                />
              </div>

              <div className="admin-field full-width">
                <label htmlFor="founder-intro">One-line introduction (shown as a quote)</label>
                <input
                  id="founder-intro"
                  type="text"
                  value={founder.intro}
                  onChange={(e) => updateFounder("intro", e.target.value)}
                />
              </div>

              <div className="admin-field full-width">
                <label htmlFor="founder-story">
                  Your story and the brand story (leave a blank line between paragraphs)
                </label>
                <textarea
                  id="founder-story"
                  rows="8"
                  value={founder.story}
                  onChange={(e) => updateFounder("story", e.target.value)}
                />
              </div>

              <div className="admin-field full-width">
                <label htmlFor="founder-photo">Your photograph</label>

                <div className="admin-media-preview">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Founder preview" />
                  ) : (
                    <span>No photo yet</span>
                  )}

                  <input
                    id="founder-photo"
                    ref={photoInput}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0] || null)}
                  />
                </div>
              </div>
            </div>

            <div className="form-footer">
              <p>The founder section on the website updates as soon as you save.</p>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={savingFounder}
              >
                {savingFounder ? "SAVING..." : "SAVE FOUNDER SECTION"}
                <span>→</span>
              </button>
            </div>
          </form>
          )}

          {/* COLLECTIONS */}
          {tab === "collections" && (
          <form className="admin-product-form" onSubmit={saveCollections}>
            <h3 className="admin-subheading">Collection descriptions, sizes and colours</h3>

            <div className="admin-collection-list">
              {collections.map((collection) => {
                const data = collectionData(collection.name);

                return (
                  <div className="admin-collection-card" key={collection.name}>
                    <h4>{collection.name}</h4>

                    <div className="admin-cover">
                      <div className="admin-cover-preview">
                        {data.cover ? (
                          <img src={data.cover} alt={`${collection.name} cover`} />
                        ) : (
                          <span>No cover picture yet</span>
                        )}
                      </div>

                      <div className="admin-cover-actions">
                        <label className="inventory-toggle admin-cover-button">
                          {coverBusy === collection.name
                            ? "UPLOADING..."
                            : data.cover
                              ? "Change cover picture"
                              : "Upload cover picture"}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={coverBusy !== ""}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              e.target.value = "";
                              if (file) changeCover(collection.name, file);
                            }}
                          />
                        </label>

                        {data.cover && (
                          <button
                            type="button"
                            className="inventory-delete"
                            disabled={coverBusy !== ""}
                            onClick={() => changeCover(collection.name, null)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="admin-field">
                      <label htmlFor={`desc-${collection.name}`}>Description</label>
                      <textarea
                        id={`desc-${collection.name}`}
                        rows="3"
                        value={data.description}
                        onChange={(e) =>
                          updateCollection(collection.name, {
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="admin-field">
                      <label htmlFor={`sizes-${collection.name}`}>
                        Available sizes (separate with commas)
                      </label>
                      <input
                        id={`sizes-${collection.name}`}
                        type="text"
                        value={data.sizes}
                        onChange={(e) =>
                          updateCollection(collection.name, { sizes: e.target.value })
                        }
                        placeholder="e.g. M, L, XL, XXL"
                        maxLength={60}
                      />
                    </div>

                    <span className="admin-mini-label">Available colours</span>

                    {data.colors.map((color, index) => (
                      <div className="admin-color-row" key={index}>
                        <input
                          type="color"
                          value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : "#20231f"}
                          onChange={(e) =>
                            changeColor(collection.name, index, { hex: e.target.value })
                          }
                          aria-label="Pick colour"
                        />

                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) =>
                            changeColor(collection.name, index, { name: e.target.value })
                          }
                          placeholder="Colour name, e.g. Wine"
                          maxLength={30}
                        />

                        <button
                          type="button"
                          className="inventory-delete"
                          onClick={() => removeColor(collection.name, index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="inventory-toggle admin-add-color"
                      onClick={() => addColor(collection.name)}
                    >
                      + Add a colour
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="form-footer">
              <p>Colours show as small swatches under each collection on the website.</p>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={savingCollections}
              >
                {savingCollections ? "SAVING..." : "SAVE COLLECTIONS"}
                <span>→</span>
              </button>
            </div>
          </form>
          )}
        </>
      )}

    </section>
  );
}

export default AdminSiteContent;