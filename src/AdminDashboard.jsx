import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Senator Wear");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const imageInputRef = useRef(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
  if (!imageFile) {
    setImagePreview(editingProduct?.image_url || "");
    return;
  }

  const previewUrl = URL.createObjectURL(imageFile);

  setImagePreview(previewUrl);

  return () => {
    URL.revokeObjectURL(previewUrl);
  };
}, [imageFile, editingProduct]);

  async function addProduct(e) {

      async function readJsonResponse(response, serviceName) {
    const responseText = await response.text();

    if (!responseText) {
      throw new Error(
        `${serviceName} returned an empty response (HTTP ${response.status}). Please try again.`
      );
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(
        `${serviceName} returned an invalid response (HTTP ${response.status}). Please try again.`
      );
    }
  }
    e.preventDefault();

    if (!imageFile) {
      setError("Please select a product image.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(
          "Your login session has expired. Please sign in again."
        );
      }

      const token = sessionData.session.access_token;

      const signatureResponse = await fetch("/api/sign-cloudinary", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

     const signatureData = await readJsonResponse(
  signatureResponse,
  "Image preparation service"
);

      if (!signatureResponse.ok) {
        throw new Error(
          signatureData.error || "Unable to prepare image upload."
        );
      }

      const uploadData = new FormData();

      uploadData.append("file", imageFile);
      uploadData.append("api_key", signatureData.apiKey);
      uploadData.append("timestamp", signatureData.timestamp);
      uploadData.append("folder", signatureData.folder);
      uploadData.append("signature", signatureData.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const uploadedImage = await readJsonResponse(
  uploadResponse,
  "Cloudinary image upload"
);

      if (!uploadResponse.ok) {
        throw new Error(
          uploadedImage.error?.message || "Image upload failed."
        );
      }

      const { error: insertError } = await supabase
        .from("products")
        .insert([
          {
            name: name.trim(),
            category,
            price: Number(price),
            description: description.trim(),
            image_url: uploadedImage.secure_url,
            is_active: true,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess("Product and image added successfully!");

      setName("");
      setCategory("Senator Wear");
      setPrice("");
      setDescription("");
      setImageFile(null);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      await loadProducts();
    } catch (error) {
      setError(
        error.message || "Something went wrong while adding the product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product) {
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Product status updated.");
    await loadProducts();
  }

  async function updateProduct(e) {
  e.preventDefault();

  if (!editingProduct) return;

  setSaving(true);
  setError("");
  setSuccess("");

  try {
    let imageUrl = editingProduct.image_url;

    // Upload a replacement image only if one was selected.
    if (imageFile) {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error("Your login session has expired. Please sign in again.");
      }

      const token = sessionData.session.access_token;

      const signatureResponse = await fetch("/api/sign-cloudinary", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(signatureData.error || "Unable to prepare image upload.");
      }

      const uploadData = new FormData();
      uploadData.append("file", imageFile);
      uploadData.append("api_key", signatureData.apiKey);
      uploadData.append("timestamp", signatureData.timestamp);
      uploadData.append("folder", signatureData.folder);
      uploadData.append("signature", signatureData.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      const uploadedImage = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadedImage.error?.message || "Image upload failed.");
      }

      imageUrl = uploadedImage.secure_url;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name: name.trim(),
        category,
        price: Number(price),
        description: description.trim(),
        image_url: imageUrl,
      })
      .eq("id", editingProduct.id);

    if (updateError) throw updateError;

    setSuccess("Product updated successfully!");

    setEditingProduct(null);
    setName("");
    setCategory("Senator Wear");
    setPrice("");
    setDescription("");
    setImageFile(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    await loadProducts();
  } catch (error) {
    setError(error.message || "Unable to update product.");
  } finally {
    setSaving(false);
  }
}
  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Product deleted.");
    await loadProducts();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  const activeProducts = products.filter(
    (product) => product.is_active
  ).length;

  const hiddenProducts = products.length - activeProducts;

  const featuredProducts = products.filter(
    (product) => product.is_featured
  ).length;

  return (
    <main className="admin-layout">
      {/* MOBILE HEADER */}
<header className="mobile-admin-header">
  <a href="#overview" className="mobile-admin-brand">
    <img
      src="/images/eldorado-logo.jpg"
      alt="Eldorado Luxe"
    />
    <span>THE LUNGU TAILOR</span>
  </a>

  <button
    type="button"
    className="mobile-menu-button"
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
    aria-expanded={isMobileMenuOpen}
  >
    {isMobileMenuOpen ? "✕" : "☰"}
  </button>
</header>

{/* MOBILE NAVIGATION DRAWER */}
{isMobileMenuOpen && (
  <div className="mobile-navigation-overlay">
    <nav className="mobile-navigation">

      <a href="#overview" onClick={() => setIsMobileMenuOpen(false)}>
        <span className="mobile-nav-icon">⌂</span>
        <span>Dashboard</span>
      </a>

      <a href="#add-product" onClick={() => setIsMobileMenuOpen(false)}>
        <span className="mobile-nav-icon">＋</span>
        <span>Add a product</span>
      </a>

      <a href="#inventory" onClick={() => setIsMobileMenuOpen(false)}>
        <span className="mobile-nav-icon">▤</span>
        <span>Product inventory</span>
      </a>

      <button type="button" onClick={logout}>
        <span className="mobile-nav-icon">↪</span>
        <span>Logout</span>
      </button>

    </nav>
  </div>
)}
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <a href="#overview" className="admin-sidebar-brand">
  <img
    src="/images/eldorado-logo.jpg"
    alt="Eldorado Luxe - The Lungu Tailor"
    className="admin-sidebar-logo"
  />

  <small>THE LUNGU TAILOR</small>
</a>

        <div className="sidebar-divider"></div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="admin-navigation">
          <a href="#overview" className="admin-nav-link active">
            <span className="nav-icon">⌂</span>
            Dashboard
          </a>

          <a href="#add-product" className="admin-nav-link">
            <span className="nav-icon">＋</span>
            Add a product
          </a>

          <a href="#inventory" className="admin-nav-link">
            <span className="nav-icon">▤</span>
            Product inventory
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-brand-note">
            <span>EST.</span>
            <strong>ELDORADO LUXE</strong>
            <small>STYLE WITHOUT COMPROMISE</small>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
          >
            <span>↗</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="topbar-label">ELDORADO LUXE / ADMINISTRATION</p>
            <p className="topbar-status">
              <span></span> Store management workspace
            </p>
          </div>

          <button
            type="button"
            className="topbar-logout"
            onClick={logout}
          >
            Sign out
          </button>
        </header>

        <div className="admin-content">
          {/* OVERVIEW */}
          <section id="overview" className="admin-welcome">
            <div>
              <p className="admin-eyebrow">YOUR STORE AT A GLANCE</p>
              <h1>Welcome back.</h1>
              <p>
                Manage your collections and keep your store looking its best.
              </p>
            </div>

            <div className="welcome-decoration">
              <span>EL</span>
            </div>
          </section>

          {/* STATISTICS */}
          <section className="admin-stats">
            <article className="stat-card">
              <span className="stat-label">TOTAL PRODUCTS</span>
              <strong>{products.length}</strong>
              <small>Products in your store</small>
            </article>

            <article className="stat-card">
              <span className="stat-label">PUBLISHED</span>
              <strong>{activeProducts}</strong>
              <small>Visible on your storefront</small>
            </article>

            <article className="stat-card">
              <span className="stat-label">HIDDEN</span>
              <strong>{hiddenProducts}</strong>
              <small>Not currently displayed</small>
            </article>

            <article className="stat-card">
              <span className="stat-label">FEATURED</span>
              <strong>{featuredProducts}</strong>
              <small>Featured products</small>
            </article>
          </section>

          {/* NOTIFICATIONS */}
          {error && (
            <p className="admin-message admin-message-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="admin-message admin-message-success" role="status">
              {success}
            </p>
          )}

          {/* ADD PRODUCT */}
          <section id="add-product" className="admin-panel add-product-panel">
            <div className="panel-heading">
              <div>
                <p className="admin-eyebrow">EXPAND YOUR COLLECTION</p>
                <h2>{editingProduct ? "Edit product details" : "Add a new product"}</h2>
                <p>
                  Add a new outfit to your store and make it available to
                  customers.
                </p>
              </div>

              <span className="panel-number">01</span>
            </div>

           <form
  onSubmit={editingProduct ? updateProduct : addProduct}
  className="admin-product-form"
>
              <div className="form-grid">
                <div className="admin-field">
                  <label htmlFor="product-name">Product name</label>
                  <input
                    id="product-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Classic Senator Set"
                    
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="product-category">Category</label>
                  <select
                    id="product-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Senator Wear</option>
                    <option>Agbada</option>
                    <option>Kaftan</option>
                    <option>Two-Piece</option>
                    <option>Dansiki</option>
                  </select>
                </div>

                <div className="admin-field">
                  <label htmlFor="product-price">Price (₦)</label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 85000"
                    required
                  />
                </div>

               <div className="admin-field full-width">
  <label htmlFor="product-image">Product photograph</label>

  <div className="image-upload-box">
    <div className="image-preview-area">
      {imagePreview ? (
        <img
          src={imagePreview}
          alt="Product preview"
          className="image-preview"
        />
      ) : (
        <div className="image-upload-placeholder">
          <span>↑</span>
          <strong>YOUR PRODUCT PHOTOGRAPH</strong>
          <small>Upload a high-quality outfit image</small>
        </div>
      )}
    </div>

    <div className="image-upload-controls">
      <div>
        <strong>
          {imageFile
            ? imageFile.name
            : editingProduct
              ? "Current product image"
              : "No photograph selected"}
        </strong>

        <small>
          JPG, PNG or WEBP · Choose a clear, high-quality image.
        </small>
      </div>

      <input
        id="product-image"
        ref={imageInputRef}
        className="image-file-input"
        type="file"
        accept="image/*"
        onChange={(e) =>
          setImageFile(e.target.files[0] || null)
        }
        required={!editingProduct}
      />
    </div>
  </div>

  {editingProduct && (
    <small className="selected-file">
      Leave empty to retain the current product photograph.
    </small>
  )}
</div>

                <div className="admin-field full-width">
                  <label htmlFor="product-description">Description</label>
                  <textarea
                    id="product-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the fabric, fit and details..."
                    rows="4"
                  />
                </div>
              </div>

              <div className="form-footer">
                <p>
                  Images are securely uploaded and stored with your product.
                </p>
                {editingProduct && (
  <button
    type="button"
    className="inventory-delete"
    onClick={() => {
      setEditingProduct(null);
      setName("");
      setCategory("Senator Wear");
      setPrice("");
      setDescription("");
      setImageFile(null);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      setError("");
      setSuccess("");
    }}
  >
    CANCEL EDITING
  </button>
)}

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                 {saving
  ? editingProduct
    ? "SAVING CHANGES..."
    : "UPLOADING PRODUCT..."
  : editingProduct
    ? "SAVE CHANGES"
    : "ADD PRODUCT"}
                  <span>→</span>
                </button>
              </div>
            </form>
          </section>

          {/* PRODUCT INVENTORY */}
          <section id="inventory" className="admin-panel inventory-panel">
            <div className="panel-heading inventory-heading">
              <div>
                <p className="admin-eyebrow">YOUR COLLECTION</p>
                <h2>Product inventory</h2>
                <p>View and manage the outfits in your online store.</p>
              </div>

              <span className="inventory-count">
                {products.length} PRODUCTS
              </span>
            </div>

            {loading ? (
              <p className="inventory-empty">Loading your products...</p>
            ) : products.length === 0 ? (
              <p className="inventory-empty">
                No products have been added yet. Your collection will appear
                here once you add your first outfit.
              </p>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <article className="inventory-product" key={product.id}>
                    <div className="inventory-image-wrap">
                      <img
                        src={
                          product.image_url ||
                          "/images/eldorado-hero.png"
                        }
                        alt={product.name}
                        loading="lazy"
                      />

                      <span
                        className={`product-status ${
                          product.is_active ? "published" : "hidden"
                        }`}
                      >
                        {product.is_active ? "PUBLISHED" : "HIDDEN"}
                      </span>
                    </div>

                    <div className="inventory-product-details">
                      <p className="inventory-category">
                        {product.category}
                      </p>

                      <h3>{product.name}</h3>

                      <strong className="inventory-price">
                        ₦
                        {Number(product.price).toLocaleString("en-NG")}
                      </strong>

                      <div className="inventory-actions">

  {/* EDIT BUTTON */}
  <button
    type="button"
    className="inventory-toggle"
    onClick={() => {
      setEditingProduct(product);
      setName(product.name);
      setCategory(product.category);
      setPrice(String(product.price));
      setDescription(product.description || "");
      setImageFile(null);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      setError("");
      setSuccess("");

      document.getElementById("add-product")?.scrollIntoView({
        behavior: "smooth",
      });
    }}
  >
    Edit
  </button>

  {/* HIDE / PUBLISH BUTTON */}
  <button
    type="button"
    className="inventory-toggle"
    onClick={() => toggleProduct(product)}
  >
    {product.is_active ? "Hide product" : "Publish"}
  </button>

  {/* DELETE BUTTON */}
  <button
    type="button"
    className="inventory-delete"
    onClick={() => deleteProduct(product)}
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

          <footer className="admin-footer">
            <span>ELDORADO LUXE</span>
            <p>THE LUNGU TAILOR · STYLE WITHOUT COMPROMISE</p>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;