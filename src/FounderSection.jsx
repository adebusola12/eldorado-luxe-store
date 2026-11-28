// "Meet the founder" — the owner introduces himself and the brand.
// The text and photo come from the admin (Site content), with safe defaults.

function FounderSection({ founder }) {
  const paragraphs = (founder.story || "")
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter(Boolean);

  return (
    <section className="founder-section" id="founder">
      <div className="founder-inner">

        <div className="founder-photo">
          {founder.image_url ? (
            <img src={founder.image_url} alt={founder.name} loading="lazy" />
          ) : (
            <div className="founder-monogram" aria-hidden="true">
              <span>EL</span>
            </div>
          )}
        </div>

        <div className="founder-text">
          <p className="eyebrow">MEET THE FOUNDER</p>

          <h2>{founder.name}</h2>

          <p className="founder-title">{founder.title}</p>

          {founder.intro && (
            <blockquote className="founder-quote">“{founder.intro}”</blockquote>
          )}

          {paragraphs.map((text, index) => (
            <p className="founder-paragraph" key={index}>
              {text}
            </p>
          ))}

          <div className="founder-actions">
            <a href="#/consultation" className="founder-button">
              BOOK A CONSULTATION
            </a>
            <a href="#shop" className="text-link">
              SEE THE COLLECTIONS →
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

export default FounderSection;