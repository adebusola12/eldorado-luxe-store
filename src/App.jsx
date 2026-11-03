import { useState } from "react";
import "./App.css";

const collections = [
  { name: "Agbada", folder: "agbada", description: "Statement pieces with regal presence." },
  { name: "Senator Wear", folder: "senator", description: "Sharp, refined traditional tailoring." },
  { name: "Kaftan", folder: "kaftan", description: "Effortless elegance for every occasion." },
  { name: "Two-Piece", folder: "two-piece", description: "Coordinated looks with a modern edge." },
  { name: "Dansiki", folder: "dansiki", description: "Heritage-inspired style with character." },
];

const names = {
  Agbada: ["Royal Blue Agbada", "Ivory Elegance Agbada", "Classic Black Agbada", "Regal Wine Agbada"],
  "Senator Wear": ["Classic Black Senator", "Navy Blue Senator", "White Prestige Senator", "Modern Grey Senator"],
  Kaftan: ["	The Signature Stripes", "The White Prestige", "	The Classic Essential", "The Teal Royale"],
  "Two-Piece": ["	The Black Signature", "	The Emerald Executive", "	The Purple Prestige", "	The White Signature"],
  Dansiki: ["	The Black Heritage", "	The Green Heritage", "	The White Heritage", "The Wine Heritage"],
};

// SAMPLE prices only: confirm all product names and prices with the owner.
const prices = {
  Agbada: [185000, 195000, 210000, 200000],
  "Senator Wear": [85000, 90000, 95000, 80000],
  Kaftan: [75000, 80000, 82000, 78000],
  "Two-Piece": [70000, 75000, 78000, 74000],
  Dansiki: [65000, 70000, 72000, 68000],
};



const products = collections.flatMap(({ name: category, folder }) =>
  names[category].map((name, i) => {
    const imageFiles = {
      agbada: [
        "grey agbada.jpg",
        "purple agbada.jpg",
        "sky blue agbada.jpg",
        "white agbada.jpg",
      ],

      senator: [
        "black senator.jpg",
        "navy blue senator.jpg",
        "white senator.jpg",
        "grey senator.jpg",
      ],

      kaftan: [
        "kaftan stripes.jpg",
        "white kaftan.jpg",
        "simple kaftan.jpg",
        "teal blue kaftan.jpg",
      ],

      "two-piece": [
        "black two-piece.jpg",
        "green two-piece.jpg",
        "purple two-piece.jpg",
        "white two-piece.jpg",
      ],

      dansiki: [
        "black dansiki.jpg",
        "green dansiki.jpg",
        "white dansiki.jpg",
        "wine dansiki.jpg",
      ],
    };

    const imageFile = imageFiles[folder]
      ? imageFiles[folder][i]
      : `${folder}-${i + 1}.jpg`;

    return {
      id: `${folder}-${i + 1}`,
      name,
      category,
      price: prices[category][i],
      image: `/images/${folder}/${encodeURIComponent(imageFile)}`,
      badge: i === 0 ? "FEATURED" : i === 1 ? "NEW STYLE" : "",
    };
  })
);



function formatPrice(price) {
  return "₦" + price.toLocaleString("en-NG");
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  function showMessage(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      return existing
        ? current.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...current, { ...product, quantity: 1 }];
    });
    showMessage(`${product.name} added to your bag!`);
  }

  function chooseCollection(category) {
    setSelectedCategory(category);
    document.getElementById("product-list")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="store">
      <div className="announcement">
        <p>Complimentary delivery on orders over ₦150,000</p>
        <p>Discover timeless Nigerian craftsmanship with ELDORADO LUXE</p>
      </div>

      <header className="header">
        <a className="logo" href="#home" aria-label="Eldorado Luxe home">
          <img src="/images/eldorado-logo.jpg" alt="Eldorado Luxe - The Lungu Tailor" className="header-logo" />
        </a>
        <nav className="navigation" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#shop">Shop</a>
          <a href="#collections">Collections</a>
          <a href="#about">Our Story</a>
        </nav>
        <div className="header-actions">
          <a href="#shop" className="shop-link">Explore</a>
          <button className="bag-button" onClick={() => showMessage(cartCount ? `Your bag contains ${cartCount} item(s).` : "Your shopping bag is empty.")}>
            Bag ({cartCount})
          </button>
        </div>
      </header>

      {message && (
        <div className="toast" role="status">
          {message}
          <button onClick={() => setMessage("")} aria-label="Close notification">×</button>
        </div>
      )}

      <main>
        <section className="hero" id="home">
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">THE MODERN GENTLEMAN</p>
            <h1>Dress well.<br />Live <em>exceptionally.</em></h1>
            <p className="hero-description">
              Timeless essentials. Contemporary style.<br />
              Discover clothing made for the man you are becoming.
            </p>
            <a href="#shop" className="primary-button">SHOP THE COLLECTION <span>→</span></a>
            <div className="hero-note">CONSIDERED STYLE. EXCEPTIONAL QUALITY.</div>
          </div>
          <div className="hero-side-label">EST. FOR THE MODERN MAN</div>
        </section>

        <section className="benefits" aria-label="Our values">
          <div><span className="benefit-icon">✳</span><div><h3>Quality First</h3><p>Thoughtfully selected pieces</p></div></div>
          <div><span className="benefit-icon">◇</span><div><h3>Timeless Style</h3><p>Designed beyond trends</p></div></div>
          <div><span className="benefit-icon">↗</span><div><h3>Made for You</h3><p>Style for every occasion</p></div></div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div><p className="eyebrow">THE COLLECTION</p><h2>Find your <em>signature.</em></h2></div>
            <p className="section-description">Explore Nigerian traditional menswear,<br />thoughtfully selected for your signature style.</p>
          </div>

          <div className="collection-cards" id="collections">
            {collections.map((collection) => (
              <button
                type="button"
                key={collection.name}
                className={selectedCategory === collection.name ? "collection-card active" : "collection-card"}
                onClick={() => chooseCollection(collection.name)}
              >
                <span className="collection-card-title">{collection.name}</span>
                <span className="collection-card-description">{collection.description}</span>
                <span className="collection-card-link">EXPLORE COLLECTION →</span>
              </button>
            ))}
          </div>

          <div className="category-filters" aria-label="Filter products">
            <button type="button" className={selectedCategory === "All" ? "filter active" : "filter"} onClick={() => setSelectedCategory("All")}>All Collections</button>
            {collections.map((collection) => (
              <button type="button" key={collection.name} className={selectedCategory === collection.name ? "filter active" : "filter"} onClick={() => setSelectedCategory(collection.name)}>{collection.name}</button>
            ))}
          </div>

          <div id="product-list" className="product-list-heading">
            <p className="eyebrow">{selectedCategory === "All" ? "OUR SELECTION" : selectedCategory.toUpperCase()}</p>
            <h2>{selectedCategory === "All" ? "Explore all styles" : `${selectedCategory} styles`}</h2>
            {selectedCategory !== "All" && <button type="button" className="text-link collection-back" onClick={() => setSelectedCategory("All")}>← VIEW ALL COLLECTIONS</button>}
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  <img src={product.image} alt={product.name} loading="lazy" />
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                  <button className="quick-add" type="button" onClick={() => addToCart(product)}>+ ADD TO BAG</button>
                </div>
                <div className="product-details">
                  <div><p className="product-category">{product.category}</p><h3>{product.name}</h3></div>
                  <p className="product-price">{formatPrice(product.price)}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="view-all"><p>GOOD STYLE IS NEVER AN ACCIDENT.</p></div>
          <p className="sample-price-note">Preview catalogue: product names and prices are examples. Confirm them with ELDORADO LUXE before launch.</p>
        </section>

        <section className="story-section" id="about">
          <div className="story-image"><img src="/images/eldorado-hero.png" alt="Traditional menswear detail from Eldorado Luxe" loading="lazy" /></div>
          <div className="story-content">
            <p className="eyebrow">OUR PHILOSOPHY</p>
            <h2>Confidence is<br />always <em>in style.</em></h2>
            <p>We believe getting dressed should feel effortless. Our collection celebrates Nigerian traditional menswear with considered details and timeless style for the modern gentleman.</p>
            <a href="#shop" className="text-link">DISCOVER YOUR STYLE →</a>
          </div>
        </section>

        <section className="newsletter">
          <p className="eyebrow">THE GENTLEMAN&apos;S EDIT</p>
          <h2>A better wardrobe starts here.</h2>
          <p>Get updates on new arrivals, style inspiration, and exclusive offers.</p>
          <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); showMessage("Thanks for your interest! Newsletter signup will be connected later."); }}>
            <input type="email" placeholder="Enter your email address" aria-label="Email address" required />
            <button type="submit">SIGN ME UP →</button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <a className="logo footer-logo" href="#home" aria-label="Eldorado Luxe home">
          <img src="/images/eldorado-logo.jpg" alt="Eldorado Luxe - The Lungu Tailor" className="footer-logo-image" />
        </a>
        <p>Style that speaks without saying a word.</p>
        <div className="footer-links"><a href="#shop">Shop</a><a href="#about">About Us</a><a href="mailto:Igbedelekan6@gmail.com">Contact</a></div>
        <div className="footer-bottom"><p>© {new Date().getFullYear()} ELDORADO LUXE. All rights reserved.</p><p>THE LUNGU TAILOR</p></div>
      </footer>
    </div>
  );
}

export default App;
