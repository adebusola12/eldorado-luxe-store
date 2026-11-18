// Each collection described, with the colours it comes in.
// Descriptions and colours are edited by the owner in the admin.

function CollectionStories({ collections, collectionInfo, products, onExplore }) {
  return (
    <section className="stories-section" id="collection-stories">

      <div className="section-heading">
        <p className="eyebrow">THE COLLECTIONS</p>
        <h2>
          Find your <em>fit.</em>
        </h2>
        <p>
          A closer look at each collection, and the colours you can choose from.
        </p>
      </div>

      <div className="stories-list">
        {collections.map((collection) => {
          const info = collectionInfo?.[collection.name] || {};
          const description = info.description || collection.description;
          const colors = Array.isArray(info.colors) ? info.colors : [];

          const firstProduct = products.find(
            (product) => product.category === collection.name
          );

          return (
            <article className="story-card" key={collection.name}>

              <div className="story-card-image">
                <img
                  src={firstProduct?.image || "/images/eldorado-hero.png"}
                  alt={`${collection.name} collection`}
                  loading="lazy"
                />
              </div>

              <div className="story-card-text">
                <h3>{collection.name}</h3>

                <p>{description}</p>

                {colors.length > 0 && (
                  <div className="color-row">
                    <span className="color-row-label">AVAILABLE COLOURS</span>

                    <ul className="color-swatches">
                      {colors.map((color, index) => (
                        <li key={`${color.name}-${index}`}>
                          <span
                            className="color-dot"
                            style={{ backgroundColor: color.hex || "#cccccc" }}
                            aria-hidden="true"
                          />
                          <span>{color.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  className="story-explore"
                  onClick={() => onExplore(collection.name)}
                >
                  EXPLORE {collection.name.toUpperCase()} →
                </button>
              </div>

            </article>
          );
        })}
      </div>

    </section>
  );
}

export default CollectionStories;