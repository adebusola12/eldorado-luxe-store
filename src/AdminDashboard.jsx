import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

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
  const imageInputRef = useRef(null);

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

  
async function addProduct(e) {
  e.preventDefault();

  if (!imageFile) {
    setError("Please select a product image.");
    return;
  }

  setSaving(true);
  setError("");
  setSuccess("");

  try {
    // 1. Get the administrator's login session.
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      throw new Error("Your login session has expired. Please sign in again.");
    }

    const token = sessionData.session.access_token;

    // 2. Request a secure upload signature from our server.
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

    // 3. Upload the selected image to Cloudinary.
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
      throw new Error(
        uploadedImage.error?.message || "Image upload failed."
      );
    }

    // 4. Save the product and its Cloudinary image URL in Supabase.
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

    // 5. Clear the form and refresh the product list.
    setSuccess("Product and image added successfully!");

    setName("");
    setPrice("");
    setDescription("");
    setImageFile(null);
    if (imageInputRef.current) {
  imageInputRef.current.value = "";
}

    await loadProducts();

  } catch (error) {
    setError(error.message || "Something went wrong while adding the product.");
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

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.brand}>ELDORADO LUXE</h1>
          <p style={styles.subtitle}>THE LUNGU TAILOR · ADMIN DASHBOARD</p>
        </div>

        <button onClick={logout} style={styles.logout}>
          Sign out
        </button>
      </header>

      <section style={styles.content}>
        <h2 style={styles.heading}>Product Management</h2>
        <p style={styles.description}>
          Add and manage the products displayed in your store.
        </p>

        <form onSubmit={addProduct} style={styles.form}>
          <h3>Add a new product</h3>

          <label>Product name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Classic Senator Set"
            required
            style={styles.input}
          />

          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.input}
          >
            <option>Senator Wear</option>
            <option>Agbada</option>
            <option>Kaftan</option>
            <option>Two-Piece</option>
            <option>Dansiki</option>
          </select>

          <label>Price (₦)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 85000"
            required
            style={styles.input}
          />
          
          <label>Product image</label>
          <input
           ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0] || null)}
          required
          style={styles.input}
         />

          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the fabric, fit and details..."
            rows="4"
            style={styles.input}
          />

          <button type="submit" disabled={saving} style={styles.addButton}>
            {saving ? "Saving..." : "Add product"}
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <section style={styles.products}>
          <h3>Store products ({products.length})</h3>

          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>No products have been added yet.</p>
          ) : (
            products.map((product) => (
              <article key={product.id} style={styles.product}>
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.category}</p>
                  <p>₦{Number(product.price).toLocaleString("en-NG")}</p>
                  <small>
                    {product.is_active ? "Published" : "Hidden"}
                  </small>
                </div>

                <div style={styles.actions}>
                  <button
                    onClick={() => toggleProduct(product)}
                    style={styles.secondaryButton}
                  >
                    {product.is_active ? "Hide" : "Publish"}
                  </button>

                  <button
                    onClick={() => deleteProduct(product)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f4ef",
    color: "#20231f",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    background: "#20231f",
    color: "#f6f4ef",
    padding: "24px 6%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  brand: {
    color: "#b49a67",
    margin: 0,
    letterSpacing: "2px",
  },
  subtitle: {
    fontSize: "11px",
    letterSpacing: "1.5px",
  },
  logout: {
    padding: "10px 18px",
    cursor: "pointer",
  },
  content: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "0 20px",
  },
  heading: {
    fontSize: "28px",
  },
  description: {
    color: "#77786f",
  },
  form: {
    background: "#fff",
    padding: "25px",
    marginTop: "30px",
    display: "grid",
    gap: "12px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #ccc",
    font: "inherit",
  },
  addButton: {
    padding: "14px",
    background: "#b49a67",
    color: "#20231f",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  products: {
    marginTop: "40px",
  },
  product: {
    background: "#fff",
    padding: "18px",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  secondaryButton: {
    padding: "9px 14px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "9px 14px",
    background: "#8b2929",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  error: {
    color: "#b00020",
  },
  success: {
    color: "green",
  },
};

export default AdminDashboard;
