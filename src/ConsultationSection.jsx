import { useState } from "react";
import { supabase } from "./supabaseClient";
import { displayName } from "./useCustomer";

function buildWhatsAppLink(number, form) {
  const lines = [
    "Hello ELDORADO LUXE, I would like to book a consultation.",
    "",
    `Name: ${form.full_name}`,
    `WhatsApp: ${form.whatsapp}`,
    form.email ? `Email: ${form.email}` : null,
    `Type: ${form.consultation_type}`,
    `Preferred time: ${form.preferred_time}`,
    form.preferred_date ? `Preferred date: ${form.preferred_date}` : null,
    form.notes ? `Notes: ${form.notes}` : null,
  ].filter((line) => line !== null);

  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}

// Consultation request. The request is saved so the owner can see it in the
// admin, then the customer is sent to WhatsApp with the details filled in.
function ConsultationSection({ whatsappNumber, customer }) {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("Virtual call");
  const [time, setTime] = useState("No preference");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const signedIn = customer?.user;

  async function submit(event) {
    event.preventDefault();
    setError("");

    const form = {
      full_name: fullName.trim() || (signedIn ? displayName(customer.user) : ""),
      whatsapp: whatsapp.trim(),
      email: email.trim() || (signedIn ? customer.user.email : ""),
      consultation_type: type,
      preferred_time: time,
      preferred_date: date,
      notes: notes.trim(),
    };

    if (!form.full_name || form.whatsapp.replace(/\D/g, "").length < 7) {
      setError("Please enter your name and a valid WhatsApp number.");
      return;
    }

    setSaving(true);

    const { error: saveError } = await supabase
      .from("consultations")
      .insert([form]);

    setSaving(false);

    const link = buildWhatsAppLink(whatsappNumber, form);

    setDone({ link, saved: !saveError });

    // Some phones block pop-ups, so the button below is always shown too.
    window.open(link, "_blank", "noopener,noreferrer");
  }

  function reset() {
    setDone(null);
    setNotes("");
    setDate("");
  }

  return (
    <section className="consult-section" id="consultation">

      <div className="consult-inner">

        <div className="consult-intro">
          <p className="eyebrow">LET'S TALK</p>

          <h2>
            Book a free <em>consultation.</em>
          </h2>

          <p>
            Tell us about your occasion and we will help you choose the style,
            fabric and fit. It is free, with no obligation.
          </p>

          <ul className="consult-points">
            <li>Style, fabric and colour guidance</li>
            <li>Help with taking your measurements</li>
            <li>Virtual call from anywhere, or visit us in person</li>
            <li>We reply to every request on WhatsApp</li>
          </ul>
        </div>

        <div className="consult-card">
          {done ? (
            <div className="consult-done">
              <h3>Thank you!</h3>

              <p>
                {done.saved
                  ? "Your request has been received."
                  : "We couldn't save your request here, but you can still send it to us on WhatsApp."}{" "}
                Tap the button below to continue on WhatsApp so we can confirm a time.
              </p>

              <a
                className="dark-button whatsapp-link"
                href={done.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                CONTINUE ON WHATSAPP
              </a>

              <button type="button" className="continue-link" onClick={reset}>
                Send another request
              </button>
            </div>
          ) : (
            <form className="consult-form" onSubmit={submit}>

              <label className="form-field">
                <span className="form-label">Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={signedIn ? displayName(customer.user) : "Your name"}
                  maxLength={80}
                  required={!signedIn}
                />
              </label>

              <div className="form-two">
                <label className="form-field">
                  <span className="form-label">WhatsApp number</span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 08012345678"
                    maxLength={25}
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">Email (optional)</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={signedIn ? customer.user.email : "name@email.com"}
                    maxLength={120}
                  />
                </label>
              </div>

              <div className="form-two">
                <label className="form-field">
                  <span className="form-label">Consultation type</span>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option>Virtual call</option>
                    <option>In person</option>
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">Preferred time</span>
                  <select value={time} onChange={(e) => setTime(e.target.value)}>
                    <option>No preference</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                </label>
              </div>

              <label className="form-field">
                <span className="form-label">Preferred date (optional)</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <label className="form-field">
                <span className="form-label">What are you planning? (optional)</span>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. A wedding in December, looking for an Agbada in wine or navy."
                  maxLength={600}
                />
              </label>

              {error && (
                <p className="form-message error" role="alert">
                  {error}
                </p>
              )}

              <button className="dark-button form-submit" type="submit" disabled={saving}>
                {saving ? "SENDING..." : "BOOK MY CONSULTATION"}
              </button>

            </form>
          )}
        </div>

      </div>

    </section>
  );
}

export default ConsultationSection;