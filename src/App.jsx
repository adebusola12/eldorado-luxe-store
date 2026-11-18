import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./StoreUpdates.css";
import { supabase } from "./supabaseClient";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./NewSections.css";
import { useCustomer } from "./useCustomer";
import { useSiteContent } from "./siteContent";
import FounderSection from "./FounderSection";
import CollectionStories from "./CollectionStories";
import GallerySection from "./GallerySection";
import ReviewsSection from "./ReviewsSection";
import ConsultationSection from "./ConsultationSection";
import AccountSection from "./AccountSection";

const WHATSAPP_NUMBER = "2349061363473"; // Add international digits only, e.g. 2348012345678.
const BUSINESS_EMAIL = "Igbedelekan6@gmail.com";
const BUSINESS_PHONE = "07014969829";

const PRODUCTS_PER_PAGE = 6;

// Pictures that fade in one after the other in the hero.
// Put the image files in the "public/images" folder with these exact names.
// A picture that is missing is simply skipped, so the site never breaks.
const HERO_SLIDES = [
  "/images/eldorado-hero.png",
  "/images/hero-senator.jpeg",
  "/images/hero-two-piece.jpeg",
];
const HERO_SECONDS = 6;

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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState(getSavedCart);
  const [collectionCartVisible, setCollectionCartVisible] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");
  const productCarouselRef = useRef(null);
  const customer = useCustomer();
  const [heroSlides, setHeroSlides] = useState([HERO_SLIDES[0]]);
  const [heroIndex, setHeroIndex] = useState(0);
  const { founder, collectionInfo } = useSiteContent();

  // Work out which hero pictures actually exist
  useEffect(() => {
    let cancelled = false;

    Promise.all(
      HERO_SLIDES.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => resolve(null);
            img.src = src;
          })
      )
    ).then((found) => {
      if (cancelled) return;
      const ok = found.filter(Boolean);
      if (ok.length > 0) setHeroSlides(ok);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Move to the next picture every few seconds
  useEffect(() => {
    if (heroSlides.length < 2) return undefined;

    const timer = setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, HERO_SECONDS * 1000);

    return () => clearInterval(timer);
  }, [heroSlides]);

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
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading products:", error.message);
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

      setProducts(formattedProducts);
      setProductsLoading(false);
    }

    loadProducts();
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const visibleProducts = useMemo(() => {
    let result =
      selectedCategory === "All"
        ? products
        : products.filter((product) => product.category === selectedCategory);

    const query = searchTerm.trim().toLowerCase();

    if (query) {
      result = result.filter((product) =>
        `${product.name} ${product.category}`.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, searchTerm, products]);

  // PAGINATION (only used when viewing all outfits / search results)
  const isPaginated = selectedCategory === "All";
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const displayedProducts = isPaginated
    ? visibleProducts.slice(
        (safePage - 1) * PRODUCTS_PER_PAGE,
        safePage * PRODUCTS_PER_PAGE
      )
    : visibleProducts;

  const isSearching = searchTerm.trim() !== "";

  // AUTOMATIC PRODUCT CAROUSEL (inside a single collection)
  useEffect(() => {
    if (selectedCategory === "All" || visibleProducts.length <= 1) {
      return;
    }

    const carousel = productCarouselRef.current;

    if (!carousel) return;

    const slideInterval = setInterval(() => {
      const firstCard = carousel.querySelector(".product-card");

      if (!firstCard) return;

      const cardWidth = firstCard.getBoundingClientRect().width;
      const styles = window.getComputedStyle(carousel);
      const gap = parseFloat(styles.columnGap) || 0;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      if (maxScroll <= 5) return;

      if (carousel.scrollLeft >= maxScroll - 5) {
        carousel.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        carousel.scrollTo({
          left: Math.min(carousel.scrollLeft + cardWidth + gap, maxScroll),
          behavior: "smooth",
        });
      }
    }, 3000);

    return () => clearInterval(slideInterval);
  }, [selectedCategory, visibleProducts.length]);

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
    setCollectionCartVisible(true);
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

  // Opens one collection (e.g. Agbada) and jumps to its outfits
  function chooseCollection(category) {
    setSelectedCategory(category);
    setSearchTerm("");
    setCurrentPage(1);
    setMenuOpen(false);
    scrollToProducts();
  }

  // Shows every outfit, starting from page 1
  function showAllProducts() {
    setSelectedCategory("All");
    setSearchTerm("");
    setCurrentPage(1);
    setMenuOpen(false);
    scrollToProducts();
  }

  function goToPage(page) {
    setCurrentPage(page);
    scrollToProducts();
  }

  // Search: typing "agbada" opens the Agbada collection,
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

    if (matchedCollection) {
      setSelectedCategory(matchedCollection.name);
      setSearchTerm("");
    } else {
      setSelectedCategory("All");
    }

    setCurrentPage(1);
    setSearchOpen(false);
    scrollToProducts();
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

  const isAdminPage = window.location.pathname === "/admin";
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
          <a href="#founder" onClick={() => setMenuOpen(false)}>Meet the Founder</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
          <a href="#reviews" onClick={() => setMenuOpen(false)}>Reviews</a>
          <a href="#consultation" onClick={() => setMenuOpen(false)}>Book a Consultation</a>
          <a href="#account" onClick={() => setMenuOpen(false)}>
            {customer.user ? "My Account" : "Create Account"}
          </a>
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
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSelectedCategory("All");
              }}
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

        {/* HERO SECTION */}
        <section className="hero" id="home">

          <div className="hero-slides" aria-hidden="true">
            {heroSlides.map((src, index) => (
              <div
                key={src}
                className={`hero-slide ${index === heroIndex ? "active" : ""}`}
                style={{ backgroundImage: `url("${src}")` }}
              />
            ))}
          </div>

          <div className="hero-shade" />

          {heroSlides.length > 1 && (
            <div className="hero-dots">
              {heroSlides.map((src, index) => (
                <button
                  type="button"
                  key={src}
                  className={index === heroIndex ? "active" : ""}
                  aria-label={`Show picture ${index + 1}`}
                  onClick={() => setHeroIndex(index)}
                />
              ))}
            </div>
          )}

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

            <div className="hero-actions">
              <a className="hero-button hero-button-solid" href="#shop">
                EXPLORE MEN'S COLLECTION
              </a>
              <a className="hero-button hero-button-line" href="#consultation">
                BOOK A CONSULTATION
              </a>
            </div>
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
                    src={firstProduct?.image || "/images/eldorado-hero.png"}
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
          <div className="section-heading product-heading" id="products">
            <p className="eyebrow">THE ELDORADO EDIT</p>

            <h2>
              {isSearching
                ? `Results for “${searchTerm.trim()}”`
                : selectedCategory === "All"
                  ? "Discover your next signature."
                  : selectedCategory}
            </h2>

            <p>
              {isSearching
                ? `${visibleProducts.length} outfit(s) found.`
                : selectedCategory === "All"
                  ? "Pieces chosen to make every entrance memorable."
                  : collections.find((item) => item.name === selectedCategory)?.description}
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

          {/* CATEGORY FILTERS */}
          <div className="category-filters">

            <button
              className={selectedCategory === "All" ? "filter active" : "filter"}
              onClick={() => {
                setSelectedCategory("All");
                setSearchTerm("");
              }}
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
                onClick={() => {
                  setSelectedCategory(collection.name);
                  setSearchTerm("");
                }}
              >
                {collection.name}
              </button>
            ))}

          </div>

          {/* PRODUCT GRID / COLLECTION CAROUSEL */}
          <div
            className={
              isPaginated ? "product-grid" : "product-grid product-carousel"
            }
            ref={isPaginated ? null : productCarouselRef}
          >
            {displayedProducts.map((product) => (
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

            {productsLoading ? (
              <p className="no-results">Loading our collection...</p>
            ) : visibleProducts.length === 0 ? (
              <p className="no-results">
                No outfits found. Try another search.
              </p>
            ) : null}

          </div>

          {/* PAGE NUMBERS (all outfits only) */}
          {isPaginated && totalPages > 1 && (
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

          {/* VIEW ALL BUTTON */}
          <div className="view-all-wrap">
            <button
              className="view-all-button"
              onClick={showAllProducts}
            >
              VIEW ALL PRODUCTS <span>→</span>
            </button>
          </div>

        </section>

        {/* SHOPPING BAG SUMMARY BELOW COLLECTION */}
        {cart.length > 0 && collectionCartVisible && (
          <section className="collection-cart-section" id="collection-cart">
            <button
              type="button"
              className="close-collection-cart"
              onClick={() => setCollectionCartVisible(false)}
              aria-label="Close shopping bag summary"
            >
              ×
            </button>

            <div className="collection-cart-heading">
              <p className="eyebrow">YOUR SELECTION</p>
              <h2>Your Shopping <em>Bag.</em></h2>
              <p>
                Review your selected pieces before placing your order.
              </p>
            </div>

            <div className="collection-cart-items">
              {cart.map((item) => (
                <article className="collection-cart-item" key={item.id}>

                  <img src={item.image} alt={item.name} />

                  <div className="collection-cart-details">
                    <p>{item.category}</p>
                    <h3>{item.name}</h3>
                    <strong>{formatPrice(item.price)}</strong>

                    <div className="collection-quantity">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, -1)}
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => changeQuantity(item.id, 1)}
                      >
                        +
                      </button>

                      <button
                        type="button"
                        className="collection-remove"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                </article>
              ))}
            </div>

            <div className="collection-cart-bottom">
              <div>
                <span>Subtotal</span>
                <h3>{formatPrice(cartTotal)}</h3>
              </div>

              <button
                type="button"
                className="whatsapp-checkout"
                onClick={checkoutOnWhatsApp}
              >
                ORDER VIA WHATSAPP
              </button>

            </div>

          </section>
        )}

        {/* COLLECTION DESCRIPTIONS AND COLOURS */}
        <CollectionStories
          collections={collections}
          collectionInfo={collectionInfo}
          products={products}
          onExplore={chooseCollection}
        />

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

        {/* MEET THE FOUNDER */}
        <FounderSection founder={founder} />

        {/* GALLERY: PHOTOS AND VIDEOS BY THE OWNER */}
        <GallerySection />

        {/* CUSTOMER REVIEWS */}
        <ReviewsSection
          customer={customer}
          pieceOptions={collections.map((collection) => collection.name)}
        />

        {/* CONSULTATION */}
        <ConsultationSection
          whatsappNumber={WHATSAPP_NUMBER}
          customer={customer}
        />

        {/* CUSTOMER ACCOUNT */}
        <AccountSection customer={customer} />

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
            <a
              href="#products"
              onClick={(event) => {
                event.preventDefault();
                showAllProducts();
              }}
            >
              Shop All
            </a>
            <a href="#about">Our Story</a>
            <a href="#contact">Contact</a>
          </div>

          <div>
            <h3>COLLECTIONS</h3>
            {collections.map((collection) => (
              <a
                href="#products"
                key={collection.name}
                onClick={(event) => {
                  event.preventDefault();
                  chooseCollection(collection.name);
                }}
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