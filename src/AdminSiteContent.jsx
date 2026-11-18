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

  function collectionData(name) {
    const entry = info[name] || {};
    const fallback = collections.find((item) => item.name === name);

    return {
      description:
        entry.description !== undefined
          ? entry.description
          : fallback?.description || "",
      colors: Array.isArray(entry.colors) ? entry.colors : [],
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

  async function saveCollections(event) {
    event.preventDefault();
    setSavingCollections(true);
    setMessage({ type: "", text: "" });

    // Save every collection, dropping colour rows that were left without a name.
    const value = {};

    collections.forEach((collection) => {
      const data = collectionData(collection.name);

      value[collection.name] = {
        description: data.description.trim(),
        colors: data.colors.filter((color) => color.name.trim()),
      };
    });

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
            Edit the founder section and describe each collection, including the
            colours it comes in.
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
          {/* FOUNDER */}
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

          {/* COLLECTIONS */}
          <form className="admin-product-form admin-section-gap" onSubmit={saveCollections}>
            <h3 className="admin-subheading">Collection descriptions and colours</h3>

            <div className="admin-collection-list">
              {collections.map((collection) => {
                const data = collectionData(collection.name);

                return (
                  <div className="admin-collection-card" key={collection.name}>
                    <h4>{collection.name}</h4>

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
        </>
      )}

    </section>
  );
}

export default AdminSiteContent;