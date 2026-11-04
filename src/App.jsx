import { useEffect, useMemo, useState } from "react";
import "./App.css";

const WHATSAPP_NUMBER = "2349061363473"; // Add international digits only, e.g. 2348012345678.
const BUSINESS_EMAIL = "Igbedelekan6@gmail.com";
const BUSINESS_PHONE = "07014969829";

const collections = [
  { name: "Agbada", folder: "agbada", description: "Statement pieces with regal presence." },
  { name: "Senator Wear", folder: "senator", description: "Sharp, refined traditional tailoring." },
  { name: "Kaftan", folder: "kaftan", description: "Effortless elegance for every occasion." },
  { name: "Two-Piece", folder: "two-piece", description: "Coordinated looks with a modern edge." },
  { name: "Dansiki", folder: "dansiki", description: "Heritage-inspired style with character." },
];

const productData = {
  Agbada: {
    names: ["The Grey Monarch", "The Purple Sovereign", "The Sky Blue Royale", "The White Prestige"],
    prices: [185000, 195000, 210000, 200000],
    images: ["grey agbada.jpg", "purple agbada.jpg", "sky blue agbada.jpg", "white agbada.jpg"],
  },
  "Senator Wear": {
    names: ["The Black Sovereign", "The Midnight Navy", "The Ivory Prestige", "The Grey Executive"],
    prices: [85000, 90000, 95000, 80000],
    images: ["black senator.jpg", "navy blue senator.jpg", "white senator.jpg", "grey senator.jpg"],
  },
  Kaftan: {
    names: ["The Signature Stripes", "The White Prestige", "The Classic Essential", "The Teal Royale"],
    prices: [75000, 80000, 82000, 78000],
    images: ["kaftan stripes.jpg", "white kaftan.jpg", "simple kaftan.jpg", "teal blue kaftan.jpg"],
  },
  "Two-Piece": {
    names: ["The Black Signature", "The Emerald Executive", "The Purple Prestige", "The White Signature"],
    prices: [70000, 75000, 78000, 74000],
    images: ["black two-piece.jpg", "green two-piece.jpg", "purple two-piece.jpg", "white two-piece.jpg"],
  },
  Dansiki: {
    names: ["The Black Heritage", "The Green Heritage", "The White Heritage", "The Wine Heritage"],
    prices: [65000, 70000, 72000, 68000],
    images: ["black dansiki.jpg", "green dansiki.jpg", "white dansiki.jpg", "wine dansiki.jpg"],
  },
};

const products = collections.flatMap(({ name: category, folder }) =>
  productData[category].names.map((name, index) => ({
    id: `${folder}-${index + 1}`,
    name,
    category,
    price: productData[category].prices[index],
    image: `/images/${folder}/${encodeURIComponent(productData[category].images[index])}`,
    badge: index === 0 ? "FEATURED" : index === 1 ? "NEW STYLE" : "",
  }))
);

function formatPrice(price) {
  return `₦${Number(price).toLocaleString("en-NG")}`;
}

function getSavedCart() {
  try {
    return JSON.parse(localStorage.getItem("eldorado-cart") || "[]");
  } catch {
    return [];
  }
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState(getSavedCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem("eldorado-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    document.body.classList.toggle("drawer-open", cartOpen || menuOpen || searchOpen);
    return () => document.body.classList.remove("drawer-open");
  }, [cartOpen, menuOpen, searchOpen]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const visibleProducts = useMemo(() => {
    let result = selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

    const query = searchTerm.trim().toLowerCase();

    if (query) {
      result = result.filter((product) =>
        `${product.name} ${product.category}`.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, searchTerm]);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setNotice(`${product.name} added to your bag.`);
  }

  function changeQuantity(productId, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.id !== productId));
  }
    function chooseCollection(category) {
    setSelectedCategory(category);
    setSearchTerm("");
    setMenuOpen(false);

    document.getElementById("shop")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  function checkoutOnWhatsApp() {
    if (!cart.length) return;

    if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER)) {
      setNotice("The store WhatsApp number has not been configured yet.");
      return;
    }

    const orderLines = cart.map(
      (item, index) =>
        `${index + 1}. ${item.name} (${item.category})\n${formatPrice(item.price)} x ${item.quantity} = ${formatPrice(item.price * item.quantity)}`
    );

    const message = [
      "Hello ELDORADO LUXE, I would like to place an order.",
      "",
      ...orderLines,
      "",
      `TOTAL: ${formatPrice(cartTotal)}`,
      "",
      "Please let me know the next steps. Thank you.",
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function closePanels() {
    setCartOpen(false);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  return (
    <div className="store">

      {/* ANNOUNCEMENT BAR */}
      <div className="announcement">
        <span>ELDORADO LUXE</span>
        <span className="announcement-divider">|</span>
        <span>THE LUNGU TAILOR — TRADITION, TAILORED TO EXCELLENCE</span>
      </div>

      {/* HEADER */}
      <header className="site-header">

        <button
          className="icon-button menu-trigger"
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="hamburger">
            <i />
            <i />
            <i />
          </span>
          <span className="icon-label">MENU</span>
        </button>

        <a className="center-logo" href="#home">
          <img
            src="/images/eldorado-logo.jpg"
            alt="ELDORADO LUXE - The Lungu Tailor"
          />
        </a>

        <div className="header-tools">

          <button
            className="icon-button"
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search products"
          >
            <svg viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>
            <span className="icon-label">SEARCH</span>
          </button>

          <button
            className="icon-button cart-trigger"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Open shopping bag"
          >
            <svg viewBox="0 0 24 24">
              <path d="M5 8h14l-1 13H6L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            <span className="cart-count">{cartCount}</span>
            <span className="icon-label">BAG</span>
          </button>

        </div>
      </header>

      {/* BACKGROUND OVERLAY */}
      {(cartOpen || menuOpen || searchOpen) && (
        <button
          className="screen-overlay"
          type="button"
          onClick={closePanels}
          aria-label="Close panel"
        />
      )}

      {/* SIDE MENU */}
      <aside className={`side-drawer menu-drawer ${menuOpen ? "is-open" : ""}`}>

        <div className="drawer-heading">
          <span>MENU</span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="drawer-nav">
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>

          <button onClick={() => chooseCollection("All")}>
            Shop All
          </button>

          <p>COLLECTIONS</p>

          {collections.map((collection) => (
            <button
              key={collection.name}
              onClick={() => chooseCollection(collection.name)}
            >
              {collection.name}
            </button>
          ))}

          <a href="#about" onClick={() => setMenuOpen(false)}>Our Story</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>

        <div className="drawer-contact">
          <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
          <a href={`tel:+234${BUSINESS_PHONE.replace(/^0/, "")}`}>
            Call the store
          </a>
        </div>

      </aside>

      {/* SHOPPING CART */}
      <aside className={`side-drawer cart-drawer ${cartOpen ? "is-open" : ""}`}>

        <div className="drawer-heading">
          <span>YOUR BAG ({cartCount})</span>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Close bag"
          >
            ×
          </button>
        </div>

        {cart.length === 0 ? (

          <div className="empty-cart">
            <div className="empty-bag-icon">♧</div>

            <h2>Your cart is empty</h2>

            <p>Discover pieces made for your signature style.</p>

            <button
              className="dark-button"
              onClick={() => {
                setCartOpen(false);
                document.getElementById("shop")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              CONTINUE SHOPPING
            </button>

            <div className="account-prompt">
              <strong>Have an account?</strong>
              <span>Log in to check out faster</span>
              <small>Customer accounts coming soon.</small>
            </div>
          </div>

        ) : (

          <>
            <div className="cart-items">

              {cart.map((item) => (
                <article className="cart-item" key={item.id}>

                  <img src={item.image} alt={item.name} />

                  <div className="cart-item-info">
                    <p className="cart-item-category">{item.category}</p>
                    <h3>{item.name}</h3>
                    <strong>{formatPrice(item.price)}</strong>

                    <div className="quantity-control">
                      <button
                        onClick={() => changeQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() => changeQuantity(item.id, 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>

                      <button
                        className="remove-item"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                </article>
              ))}

            </div>

            <div className="cart-summary">

              <div className="subtotal-row">
                <span>Subtotal</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>

              <p>
                Delivery details and any applicable charges will be confirmed
                on WhatsApp.
              </p>

              <button
                className="whatsapp-checkout"
                onClick={checkoutOnWhatsApp}
              >
                ORDER VIA WHATSAPP <span>↗</span>
              </button>

              <button
                className="continue-link"
                onClick={() => setCartOpen(false)}
              >
                Continue shopping
              </button>

            </div>
          </>

        )}

      </aside>
            {/* SEARCH PANEL */}
      <aside className={`search-panel ${searchOpen ? "is-open" : ""}`}>

        <div className="drawer-heading">
          <span>SEARCH THE COLLECTION</span>
          <button
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        <label className="search-field">
          <input
            autoFocus={searchOpen}
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSelectedCategory("All");
            }}
            placeholder="Search outfits..."
          />
        </label>

        <p className="search-hint">
          Search by outfit name or collection.
        </p>

        <button
          className="dark-button"
          onClick={() => {
            setSearchOpen(false);
            document.getElementById("shop")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          VIEW {visibleProducts.length} RESULT(S)
        </button>

      </aside>

      {/* NOTIFICATION */}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      <main>

        {/* HERO SECTION */}
        <section className="hero" id="home">

          <div className="hero-shade" />

          <div className="hero-content">
            <p className="eyebrow">THE MODERN GENTLEMAN</p>

            <h1>
              Tradition,<br />
              <em>tailored to excellence.</em>
            </h1>

            <p className="hero-description">
              Discover Nigerian traditional menswear crafted for presence,
              confidence and distinction.
            </p>

            <a href="#shop" className="primary-button">
              SHOP NOW <span>→</span>
            </a>
          </div>

          <span className="hero-caption">
            ELDORADO LUXE · THE LUNGU TAILOR
          </span>

        </section>

        {/* BRAND VALUES */}
        <section className="intro-strip">
          <p>TIMELESS TRADITION</p>
          <span>✳</span>
          <p>REFINED CRAFTSMANSHIP</p>
          <span>✳</span>
          <p>MADE FOR THE MODERN MAN</p>
        </section>

        {/* COLLECTIONS AND PRODUCTS */}
        <section className="shop-section" id="shop">

          <div className="section-heading">
            <p className="eyebrow">CURATED FOR YOU</p>
            <h2>Explore the <em>collections.</em></h2>
            <p>
              Traditional Nigerian style, thoughtfully selected for every occasion.
            </p>
          </div>

          {/* COLLECTION IMAGE GRID */}
          <div className="collection-grid" id="collections">

            {collections.map((collection, index) => {
              const firstProduct = products.find(
                (product) => product.category === collection.name
              );

              return (
                <button
                  className="collection-tile"
                  type="button"
                  key={collection.name}
                  onClick={() => chooseCollection(collection.name)}
                >
                  <img
                    src={firstProduct.image}
                    alt={`${collection.name} collection`}
                    loading="lazy"
                  />

                  <span className="collection-tile-shade" />

                  <span className="collection-tile-text">
                    <small>0{index + 1}</small>
                    <strong>{collection.name}</strong>
                    <em>EXPLORE →</em>
                  </span>
                </button>
              );
            })}

          </div>

          {/* PRODUCT SECTION HEADING */}
          <div className="section-heading product-heading">
            <p className="eyebrow">THE ELDORADO EDIT</p>

            <h2>
              {selectedCategory === "All"
                ? "Discover your next signature."
                : selectedCategory}
            </h2>

            <p>
              {selectedCategory === "All"
                ? "Pieces chosen to make every entrance memorable."
                : collections.find((item) => item.name === selectedCategory)?.description}
            </p>
          </div>

          {/* CATEGORY FILTERS */}
          <div className="category-filters">

            <button
              className={selectedCategory === "All" ? "filter active" : "filter"}
              onClick={() => setSelectedCategory("All")}
            >
              VIEW ALL
            </button>

            {collections.map((collection) => (
              <button
                key={collection.name}
                className={
                  selectedCategory === collection.name
                    ? "filter active"
                    : "filter"
                }
                onClick={() => setSelectedCategory(collection.name)}
              >
                {collection.name}
              </button>
            ))}

          </div>

          {/* PRODUCT GRID */}
          <div className="product-grid">

            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>

                <div className="product-image">

                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                  />

                  {product.badge && (
                    <span className="product-badge">
                      {product.badge}
                    </span>
                  )}

                  <button
                    className="quick-add"
                    onClick={() => addToCart(product)}
                  >
                    ADD TO BAG <span>+</span>
                  </button>

                </div>

                <div className="product-details">

                  <div>
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                  </div>

                  <p className="product-price">
                    {formatPrice(product.price)}
                  </p>

                </div>

              </article>
            ))}

            {visibleProducts.length === 0 && (
              <p className="no-results">
                No outfits found. Try another search.
              </p>
            )}

          </div>

          {/* VIEW ALL BUTTON */}
          <div className="view-all-wrap">
            <button
              className="view-all-button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchTerm("");
              }}
            >
              VIEW ALL PRODUCTS <span>→</span>
            </button>
          </div>

          <p className="sample-price-note">
            Product names and prices shown are sample details and should be
            confirmed by the store owner.
          </p>

        </section>
                {/* OUR STORY */}
        <section className="story-section" id="about">

          <div className="story-content">
            <p className="eyebrow">OUR PHILOSOPHY</p>

            <h2>
              Heritage with<br />
              <em>a modern edge.</em>
            </h2>

            <p>
              ELDORADO LUXE celebrates Nigerian traditional menswear through
              considered details, confident silhouettes and timeless style
              for the modern gentleman.
            </p>

            <a href="#shop" className="text-link">
              DISCOVER THE COLLECTION →
            </a>
          </div>

        </section>

        {/* CONTACT */}
        <section className="contact-band" id="contact">

          <p className="eyebrow">LET'S CONNECT</p>

          <h2>Need help choosing your look?</h2>

          <p>
            Get in touch with ELDORADO LUXE and we'll be happy to assist.
          </p>

          <a className="contact-email" href={`mailto:${BUSINESS_EMAIL}`}>
            {BUSINESS_EMAIL}
          </a>

          <a
            className="contact-phone"
            href={`tel:+234${BUSINESS_PHONE.replace(/^0/, "")}`}
          >
            Call: {BUSINESS_PHONE}
          </a>

        </section>

      </main>

      {/* FOOTER — NO LOGO */}
      <footer className="footer">

        <p className="footer-tagline">ELDORADO LUXE — THE LUNGU TAILOR</p>

        <div className="footer-columns">

          <div>
            <h3>QUICK LINKS</h3>
            <a href="#home">Home</a>
            <a href="#shop">Shop All</a>
            <a href="#about">Our Story</a>
            <a href="#contact">Contact</a>
          </div>

          <div>
            <h3>COLLECTIONS</h3>
            {collections.map((collection) => (
              <a
                href="#shop"
                key={collection.name}
                onClick={() => setSelectedCategory(collection.name)}
              >
                {collection.name}
              </a>
            ))}
          </div>

          <div>
            <h3>CONTACT</h3>
            <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
            <a href={`tel:+234${BUSINESS_PHONE.replace(/^0/, "")}`}>
              {BUSINESS_PHONE}
            </a>
            <span>WhatsApp orders available at checkout</span>
          </div>

          <div>
  <h3>FOLLOW US</h3>
  <a
    href="https://www.instagram.com/eldoradoluxe/"
    target="_blank"
    rel="noopener noreferrer"
  >
    Instagram
  </a>
  <a
    href="https://www.tiktok.com/@eldoradoluxe"
    target="_blank"
    rel="noopener noreferrer"
  >
    TikTok
  </a>
  <a
    href="https://www.google.com/search?q=Eldorado+luxe"
    target="_blank"
    rel="noopener noreferrer"
  >
    Find us on Google
  </a>
</div>

        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} ELDORADO LUXE. All rights reserved.
          </p>
          <p>TRADITION, TAILORED TO EXCELLENCE.</p>
        </div>

      </footer>

    </div>
  );
}

export default App;