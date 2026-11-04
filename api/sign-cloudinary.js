
const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      ADMIN_EMAIL,
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET,
    } = process.env;

    // Confirm that all required settings exist.
    if (
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY ||
      !ADMIN_EMAIL ||
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        error: "Server configuration is incomplete.",
      });
    }

    // Check the administrator's login token.
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!token) {
      return res.status(401).json({
        error: "Please log in as administrator.",
      });
    }

    const authResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!authResponse.ok) {
      return res.status(401).json({
        error: "Your login session is invalid or expired.",
      });
    }

    const user = await authResponse.json();

    if (
      !user.email ||
      user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {
      return res.status(403).json({
        error: "You are not authorised to upload products.",
      });
    }

    // Create a signed Cloudinary upload request.
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "eldorado-luxe/products";

    const signatureString =
      `folder=${folder}&timestamp=${timestamp}` +
      CLOUDINARY_API_SECRET;

    const signature = crypto
      .createHash("sha1")
      .update(signatureString)
      .digest("hex");

    return res.status(200).json({
      signature,
      timestamp,
      folder,
      apiKey: CLOUDINARY_API_KEY,
      cloudName: CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error("Cloudinary signing error:", error);

    return res.status(500).json({
      error: "Unable to prepare the image upload.",
    });
  }
};
