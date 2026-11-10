
import crypto from "crypto";

export default async function handler(req, res) {
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

    const missingVariables = [];

if (!SUPABASE_URL) missingVariables.push("SUPABASE_URL");
if (!SUPABASE_ANON_KEY) missingVariables.push("SUPABASE_ANON_KEY");
if (!ADMIN_EMAIL) missingVariables.push("ADMIN_EMAIL");
if (!CLOUDINARY_CLOUD_NAME) missingVariables.push("CLOUDINARY_CLOUD_NAME");
if (!CLOUDINARY_API_KEY) missingVariables.push("CLOUDINARY_API_KEY");
if (!CLOUDINARY_API_SECRET) missingVariables.push("CLOUDINARY_API_SECRET");

if (missingVariables.length > 0) {
  return res.status(500).json({
    error: "Server configuration is incomplete.",
    missing: missingVariables,
  });
}

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
}
