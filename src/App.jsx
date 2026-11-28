import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./StoreUpdates.css";
import { supabase } from "./supabaseClient";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./NewSections.css";
import "./Pages.css";
import { useCustomer } from "./useCustomer";
import { useSiteContent } from "./siteContent";
import FounderSection from "./FounderSection";
import GallerySection from "./GallerySection";
import ReviewsSection from "./ReviewsSection";
import ConsultationSection from "./ConsultationSection";
import AccountSection from "./AccountSection";

const WHATSAPP_NUMBER = "2349061363473"; // Add international digits only, e.g. 2348012345678.
const BUSINESS_EMAIL = "Igbedelekan6@gmail.com";
const BUSINESS_PHONE = "07014969829";

const PRODUCTS_PER_PAGE = 8; // 4 across x 2 rows

// The single picture shown in the hero.
// Put the file in the "public/images" folder with this exact name.
const HERO_IMAGE = "/images/outfit.jpg";

// Messages that scroll across the top of the website
const ANNOUNCEMENTS = [
  "ELDORADO LUXE",
  "THE LUNGU TAILOR",
  "TRADITION, TAILORED TO EXCELLENCE",
  "ORDER VIA WHATSAPP",
  "BOOK A CONSULTATION",
];

const collections = [
  { name: "Agbada", folder: "agbada", description: "Statement pieces with regal presence." },
  { name: "Senator Wear", folder: "senator", description: "Sharp, refined traditional tailoring." },
  { name: "Kaftan", folder: "kaftan", description: "Effortless elegance for every occasion." },
  { name: "Two-Piece", folder: "two-piece", description: "Coordinated looks with a modern edge." },
  { name: "Dansiki", folder: "dansiki", description: "Heritage-inspired style with character." },
];

// Compares category names loosely, so "Two Piece", "two-piece" and
// "Senator" still match "Two-Piece" and "Senator Wear".
function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function sameCategory(a, b) {
  const first = normalizeName(a);
  const second = normalizeName(b);

  if (!first || !second) return false;
  if (first === second) return true;

  return (
    first.length >= 5 &&
    second.length >= 5 &&
    (first.startsWith(second) || second.startsWith(first))
  );
}

// Gives every outfit a scrambled but repeatable number for one visit
function mixOrder(id, seed) {
  const text = `${id}-${seed}`;
  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }

  return hash >>> 0;
}

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

// Page addresses look like  #/story  or  #/collection/Agbada
const PAGE_ROUTES = [
  "shop",
  "collection",
  "story",
  "founder",
  "gallery",
  "reviews",
  "consultation",
  "account",
];

const ADMIN_HASH = /(^#|\/)admin\/?$/i;

function readRoute() {
  const raw = window.location.hash || "";

  if (!raw.startsWith("#/")) {
    return { page: "home", anchor: raw.slice(1), arg: "" };
  }

  const [page, ...rest] = raw.slice(2).split("/");
  let arg = rest.join("/");

  try {
    arg = decodeURIComponent(arg);
  } catch {
    // keep the text as it is
  }

  return {
    page: PAGE_ROUTES.includes(page) ? page : "home",
    anchor: "",
    arg,
  };
}

function goTo(path) {
  window.location.hash = path;
}

function scrollToId(id) {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}

// Scrolls to the product area (small delay so open drawers can finish closing first)
function scrollToProducts() {
  setTimeout(() => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}

function App() {
  const [route, setRoute] = useState(readRoute);
  const [shuffleSeed] = useState(() => Math.random());
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [cart, setCart] = useState(getSavedCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");
  const customer = useCustomer();
  const { founder, collectionInfo } = useSiteContent();

  // Follow the page address
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  // Every time the page changes: close panels, then go to the top
  // (or to the part of the home page that was asked for)
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
    setCurrentPage(1);

    if (route.page !== "shop") setSearchTerm("");

    if (route.anchor && route.anchor !== "home") {
      scrollToId(route.anchor);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [route]);

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

  // Always go back to page 1 when the collection or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading products:", error.message);
        setProductsError(error.message);
        setProductsLoading(false);
        return;
      }

      const formattedProducts = data.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: Number(product.price),
        image: product.image_url,
        badge: product.is_featured ? "FEATURED" : "",
      }));

      const unmatched = formattedProducts.filter(
        (item) => !collections.some((c) => sameCategory(c.name, item.category))
      );

      if (unmatched.length > 0) {
        console.warn(
          "These outfits have a category that matches no collection:",
          [...new Set(unmatched.map((item) => item.category))]
        );
      }

      setProducts(formattedProducts);
      setProductsLoading(false);
    }

    loadProducts();
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // The collection being viewed ("All" on every other page)
  const selectedCategory =
    route.page === "collection"
      ? route.arg
      : "All";
  const collectionDetails = collections.find((collection) =>
    sameCategory(collection.name, selectedCategory)
  );

  const activeSearch = route.page === "shop" ? searchTerm : "";

  // Colours and sizes the owner entered for the collection being viewed
  const activeInfo = collectionInfo?.[collectionDetails?.name] || {};
  const activeColors = Array.isArray(activeInfo.colors) ? activeInfo.colors : [];
  const activeSizes = Array.isArray(activeInfo.sizes) ? activeInfo.sizes : [];

  const visibleProducts = useMemo(() => {
    let result =
      selectedCategory === "All"
        ? products
        : products.filter((product) =>
            sameCategory(product.category, selectedCategory)
          );

    const query = activeSearch.trim().toLowerCase();

    // "View all outfits" is shown in a mixed order (it changes on every visit
    // but stays the same while you flip through the pages)
    if (selectedCategory === "All") {
      result = [...result].sort(
        (a, b) => mixOrder(a.id, shuffleSeed) - mixOrder(b.id, shuffleSeed)
      );
    }

    if (query) {
      result = result.filter((product) =>
        `${product.name} ${product.category}`.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, activeSearch, products, shuffleSeed]);

  // PAGINATION (8 outfits per page)
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const displayedProducts = visibleProducts.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE
  );

  const isSearching = activeSearch.trim() !== "";

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

  // Opens the page of one collection (e.g. Agbada)
  function chooseCollection(category) {
    setMenuOpen(false);
    setSearchTerm("");
    goTo(`/collection/${encodeURIComponent(category)}`);
  }

  // Opens the page with every outfit
  function showAllProducts() {
    setMenuOpen(false);
    setSearchTerm("");

    if (route.page === "shop") {
      setCurrentPage(1);
      scrollToProducts();
    } else {
      goTo("/shop");
    }
  }

  function goToPage(page) {
    setCurrentPage(page);
    scrollToProducts();
  }

  // Search: typing "agbada" opens the Agbada page,
  // anything else (e.g. "white") searches across all outfits.
  function submitSearch(event) {
    event.preventDefault();

    const query = searchTerm.trim().toLowerCase();

    const matchedCollection =
      query.length >= 3
        ? collections.find((collection) =>
            collection.name.toLowerCase().includes(query)
          )
        : null;

    setSearchOpen(false);

    if (matchedCollection) {
      setSearchTerm("");
      goTo(`/collection/${encodeURIComponent(matchedCollection.name)}`);
      return;
    }

    if (route.page === "shop") {
      setCurrentPage(1);
      scrollToProducts();
    } else {
      goTo("/shop");
    }
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

  // The admin opens from  /admin  and also from addresses like  /#home/admin
  const [openedAdminByHash, setOpenedAdminByHash] = useState(() =>
    ADMIN_HASH.test(window.location.hash)
  );

  useEffect(() => {
    function onHashChange() {
      if (ADMIN_HASH.test(window.location.hash)) setOpenedAdminByHash(true);
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const isAdminPage =
    window.location.pathname.replace(/\/+$/, "") === "/admin" || openedAdminByHash;
  const [adminUser, setAdminUser] = useState(null);
  const [adminChecking, setAdminChecking] = useState(isAdminPage);

  useEffect(() => {
    if (!isAdminPage) return;

    let mounted = true;

    async function checkAdmin() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || user?.email?.toLowerCase() !== "igbedelekan6@gmail.com") {
        setAdminUser(null);
        setAdminChecking(false);
        return;
      }

      setAdminUser(user);
      setAdminChecking(false);
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [isAdminPage]);

  if (isAdminPage) {
    if (adminChecking) {
      return <p style={{ padding: "40px" }}>Checking administrator access...</p>;
    }

    return adminUser ? <AdminDashboard /> : <AdminLogin />;
  }

  // Outfit cards + page numbers (used by the shop page and each collection page)
  const productListing = (
    <>
      <div className="product-grid">
        {displayedProducts.map((product) => (
          route.page !== "collection" ? (
            <article className="product-card outfit-only" key={product.id}>
              <div className="product-image">
                <a
                  className="product-link"
                  href={`#/collection/${encodeURIComponent(product.category)}`}
                  aria-label={`See all ${product.category} outfits`}
                >
                  <img src={product.image} alt={product.name} loading="lazy" />
                </a>
              </div>

              {isSearching && <p className="outfit-name">{product.name}</p>}
            </article>
          ) : (
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

            {(activeColors.length > 0 || activeSizes.length > 0) && (
                <div className="product-options">
                  {activeColors.length > 0 && (
                    <div className="product-option-line">
                      <span className="product-option-label">Colours</span>
                      <span className="product-option-dots">
                        {activeColors.map((color, index) => (
                          <i
                            key={`${color.name}-${index}`}
                            style={{ backgroundColor: color.hex || "#cccccc" }}
                            title={color.name}
                          />
                        ))}
                      </span>
                    </div>
                  )}

                  {activeSizes.length > 0 && (
                    <div className="product-option-line">
                      <span className="product-option-label">Sizes</span>
                      <span>{activeSizes.join(" · ")}</span>
                    </div>
                  )}
                </div>
              )}

            <button
              type="button"
              className="add-to-bag-button"
              onClick={() => addToCart(product)}
            >
              ADD TO BAG
            </button>

          </article>
          )
        ))}

        {productsLoading ? (
          <p className="no-results">Loading our collection...</p>
        ) : visibleProducts.length === 0 ? (
          <p className="no-results">
            {productsError
              ? `We couldn't load the outfits (${productsError}).`
              : "No outfits found. Try another search."}
          </p>
        ) : null}

      </div>

      {(totalPages > 1 || (route.page === "shop" && visibleProducts.length > 0)) && (
        <nav className="pagination" aria-label="Product pages">

          <button
            type="button"
            className="page-arrow"
            disabled={safePage === 1}
            onClick={() => goToPage(safePage - 1)}
            aria-label="Previous page"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                type="button"
                className={page === safePage ? "page-number active" : "page-number"}
                onClick={() => goToPage(page)}
                aria-label={`Page ${page}`}
                aria-current={page === safePage ? "page" : undefined}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            className="page-arrow"
            disabled={safePage === totalPages}
            onClick={() => goToPage(safePage + 1)}
            aria-label="Next page"
          >
            →
          </button>

        </nav>
      )}
    </>
  );

  return (
    <div className="store">

      {/* ANNOUNCEMENT BAR (scrolling ticker) */}
      <div className="announcement" aria-label="Announcements">
        <div className="announcement-track">
          {[0, 1, 2, 3].map((copy) => (
            <div
              className="announcement-group"
              key={copy}
              aria-hidden={copy > 0 ? "true" : undefined}
            >
              {ANNOUNCEMENTS.map((text) => (
                <span className="announcement-item" key={text}>
                  {text}
                  <span className="announcement-star">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
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

          <button onClick={showAllProducts}>
            All Outfits
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

          <p>DISCOVER</p>

          <a href="#/story" onClick={() => setMenuOpen(false)}>Our Story</a>
          <a href="#/founder" onClick={() => setMenuOpen(false)}>Meet the Founder</a>
          <a href="#/gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
          <a href="#/reviews" onClick={() => setMenuOpen(false)}>Reviews</a>
          <a href="#/consultation" onClick={() => setMenuOpen(false)}>Book a Consultation</a>
          <a href="#/account" onClick={() => setMenuOpen(false)}>
            {customer.user ? "My Account" : "Create Account"}
          </a>
          <a
            href="#contact"
            onClick={(event) => {
              event.preventDefault();
              setMenuOpen(false);
              scrollToId("contact");
            }}
          >
            Contact
          </a>
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
                showAllProducts();
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

              <>
                <button
                  className="whatsapp-checkout"
                  onClick={checkoutOnWhatsApp}
                >
                  <svg
                    className="whatsapp-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.49 0 .14 5.35.14 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.79 1.48h.01c6.57 0 11.92-5.35 11.92-11.92a11.84 11.84 0 0 0-3.47-8.44ZM12.06 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.63-.24-.37a9.87 9.87 0 1 1 8.37 4.62Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.08 4.5.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
                    />
                  </svg>

                  ORDER VIA WHATSAPP
                </button>

                <button
                  className="continue-link"
                  onClick={() => setCartOpen(false)}
                >
                  Continue shopping
                </button>
              </>

            </div>
          </>

        )}

      </aside>

      {/* SEARCH PANEL */}
      <aside className={`search-panel ${searchOpen ? "is-open" : ""}`}>

        <div className="drawer-heading">
          <span>SEARCH THE COLLECTION</span>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            ×
          </button>
        </div>

        <form onSubmit={submitSearch}>
          <label className="search-field">
            <input
              autoFocus={searchOpen}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search outfits..."
            />
          </label>

          <p className="search-hint">
            Search by outfit name or collection, e.g. “Agbada”.
          </p>

          <button className="dark-button" type="submit">
            {isSearching
              ? `VIEW ${visibleProducts.length} RESULT(S)`
              : "VIEW ALL OUTFITS"}
          </button>
        </form>

      </aside>

      {/* NOTIFICATION */}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      <main>

        {/* ---------- HOME ---------- */}
        {route.page === "home" && (
          <>
        {/* HERO SECTION */}
<section className="hero hero-split" id="home">

              <div className="hero-copy">
                <p className="eyebrow">THE MODERN GENTLEMAN</p>

                <h1>
                  Tradition,<br />
                  <em>tailored to excellence.</em>
                </h1>

                <p className="hero-description">
                  Discover Nigerian traditional menswear crafted for presence,
                  confidence and distinction.
                </p>

              </div>

              <div className="hero-media">
                <div className="hero-slides" aria-hidden="true">
                  <div
                    className="hero-slide active"
                    style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
                  />
                </div>
              </div>

            </section>

            {/* MEET THE FOUNDER (right under the hero) */}
            <FounderSection founder={founder} />

        {/* BRAND VALUES */}
        <section className="intro-strip">
          <p>TIMELESS TRADITION</p>
          <span>✳</span>
          <p>REFINED CRAFTSMANSHIP</p>
          <span>✳</span>
          <p>MADE FOR THE MODERN MAN</p>
        </section>


            {/* COLLECTIONS */}
            <section className="shop-section" id="shop">

              <div className="section-heading">
                <p className="eyebrow">CURATED FOR YOU</p>
                <h2>Explore the <em>collections.</em></h2>
                <p>
                  Traditional Nigerian style, thoughtfully selected for every occasion.
                </p>
              </div>

              <div className="collection-grid" id="collections">

                {collections.map((collection, index) => {
                  const firstProduct = products.find((product) =>
                    sameCategory(product.category, collection.name)
                  );

                  return (
                    <button
                      className="collection-tile"
                      type="button"
                      key={collection.name}
                      onClick={() => chooseCollection(collection.name)}
                    >
                      {collectionInfo?.[collection.name]?.cover || firstProduct?.image ? (
                        <img
                          src={collectionInfo?.[collection.name]?.cover || firstProduct.image}
                          alt={`${collection.name} collection`}
                          loading="lazy"
                        />
                      ) : (
                        <span className="collection-tile-empty">
                          {productsError ? "Couldn't load outfits" : "No outfit added yet"}
                        </span>
                      )}

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

              {/* VIEW ALL OUTFITS (opens its own page, 8 per page) */}
              <div className="view-all-wrap">
                <a className="view-all-button" href="#/shop">
                  VIEW ALL OUTFITS <span>→</span>
                </a>
              </div>

            </section>
          </>
        )}

        {/* ---------- ALL OUTFITS ---------- */}
        {route.page === "shop" && (
          <section className="shop-section listing-page">

            <div className="section-heading product-heading" id="products">
              <p className="eyebrow">THE ELDORADO EDIT</p>

              <h2>
                {isSearching
                  ? `Results for “${searchTerm.trim()}”`
                  : "View all outfits"}
              </h2>

              <p>
                {isSearching
                  ? `${visibleProducts.length} outfit(s) found.`
                  : "Tap an outfit to see its collection, details and prices."}
              </p>

              {isSearching && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  CLEAR SEARCH ×
                </button>
              )}
            </div>

            {productListing}

          </section>
        )}

        {/* ---------- ONE COLLECTION ---------- */}
        {route.page === "collection" && (
          <section className="shop-section listing-page collection-page">

            {!collectionDetails ? (
              <div className="section-heading">
                <h2>We couldn't find that collection.</h2>
                <p>
                  <a className="text-link" href="#/shop">SEE ALL OUTFITS →</a>
                </p>
              </div>
            ) : (
              <>
                <a className="back-link" href="#shop">← All collections</a>

                <div className="collection-intro">

                  <div className="collection-intro-image">
                    {collectionInfo?.[collectionDetails.name]?.cover ||
                    products.find((item) =>
                      sameCategory(item.category, collectionDetails.name)
                    )?.image ? (
                      <img
                        src={
                          collectionInfo?.[collectionDetails.name]?.cover ||
                          products.find((item) =>
                            sameCategory(item.category, collectionDetails.name)
                          ).image
                        }
                        alt={`${collectionDetails.name} collection`}
                      />
                    ) : (
                      <span className="collection-tile-empty">No outfit added yet</span>
                    )}
                  </div>

                  <div className="collection-intro-text">
                    <p className="eyebrow">THE COLLECTION</p>
                    <h2>{collectionDetails.name}</h2>

                    <p className="collection-intro-description">
                      {collectionInfo?.[collectionDetails.name]?.description ||
                        collectionDetails.description}
                    </p>

                    {activeSizes.length > 0 && (
                      <div className="color-row">
                        <span className="color-row-label">AVAILABLE SIZES</span>

                        <ul className="size-chips">
                          {activeSizes.map((size) => (
                            <li key={size}>{size}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(collectionInfo?.[collectionDetails.name]?.colors) &&
                      collectionInfo[collectionDetails.name].colors.length > 0 && (
                        <div className="color-row">
                          <span className="color-row-label">AVAILABLE COLOURS</span>

                          <ul className="color-swatches">
                            {collectionInfo[collectionDetails.name].colors.map(
                              (color, index) => (
                                <li key={`${color.name}-${index}`}>
                                  <span
                                    className="color-dot"
                                    style={{ backgroundColor: color.hex || "#cccccc" }}
                                    aria-hidden="true"
                                  />
                                  <span>{color.name}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                </div>

                <div className="collection-products-heading" id="products">
                  <h3>Outfits in {collectionDetails.name}</h3>
                  <span>{visibleProducts.length} piece(s)</span>
                </div>

                {productListing}
              </>
            )}

          </section>
        )}

        {/* ---------- SEPARATE PAGES ---------- */}
        {route.page === "story" && (
          <div className="inner-page">
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

            <a href="#/shop" className="text-link">
              DISCOVER THE COLLECTION →
            </a>
          </div>

        </section>

          </div>
        )}

        {route.page === "founder" && (
          <div className="inner-page">
            <FounderSection founder={founder} />
          </div>
        )}

        {route.page === "gallery" && (
          <div className="inner-page">
            <GallerySection />
          </div>
        )}

        {route.page === "reviews" && (
          <div className="inner-page">
            <ReviewsSection
              customer={customer}
              pieceOptions={collections.map((collection) => collection.name)}
            />
          </div>
        )}

        {route.page === "consultation" && (
          <div className="inner-page">
            <ConsultationSection
              whatsappNumber={WHATSAPP_NUMBER}
              customer={customer}
            />
          </div>
        )}

        {route.page === "account" && (
          <div className="inner-page">
            <AccountSection customer={customer} />
          </div>
        )}

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
            <a href="#/shop">All Outfits</a>
            <a href="#/story">Our Story</a>
            <a href="#/founder">Meet the Founder</a>
            <a href="#/gallery">Gallery</a>
            <a href="#/reviews">Reviews</a>
            <a href="#/consultation">Book a Consultation</a>
            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                scrollToId("contact");
              }}
            >
              Contact
            </a>
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

            <div className="footer-social">
              <a
                href="https://www.instagram.com/eldoradoluxe/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.4" cy="6.6" r="1.1" className="dot" />
                </svg>
              </a>

              <a
                href="https://www.tiktok.com/@eldoradoluxe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="TikTok"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 3v11.2a3.8 3.8 0 1 1-3.8-3.8" />
                  <path d="M14 3c.3 2.6 1.9 4.4 4.6 4.7" />
                </svg>
              </a>

              <a
                href="https://www.google.com/search?q=Eldorado+luxe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Find us on Google"
                title="Find us on Google"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.5 12.2c0-.6-.1-1.1-.2-1.6H12v3.1h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.6-3.9 2.6-6.4Z" className="fill" />
                  <path d="M12 21c2.4 0 4.5-.8 5.9-2.2L15 16.6c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H4v2.300A9 9 0 0 0 12 21Z" className="fill" />
                  <path d="M7 13.800a5.400 5.400 0 0 1 0-3.600V7.900H4a9 9 0 0 0 0 8.200l3-2.300Z" className="fill" />
                  <path d="M12 6.600c1.300 0 2.500.5 3.400 1.300l2.500-2.500A9 9 0 0 0 4 7.900l3 2.300c.7-2.100 2.700-3.600 5-3.600Z" className="fill" />
                </svg>
              </a>
            </div>
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