import { supabase } from "./supabaseClient";

async function readJsonResponse(response, serviceName) {
  const responseText = await response.text();

  if (!responseText) {
    throw new Error(
      `${serviceName} returned an empty response (HTTP ${response.status}). Please try again.`
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(
      `${serviceName} returned an invalid response (HTTP ${response.status}). Please try again.`
    );
  }
}

// Uploads a photo or video to Cloudinary (same signed upload the product
// form already uses) and returns the secure URL.
// resourceType is "image" or "video".
export async function uploadToCloudinary(file, resourceType = "image") {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new Error("Your login session has expired. Please sign in again.");
  }

  const token = sessionData.session.access_token;

  const signatureResponse = await fetch("/api/sign-cloudinary", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const signatureData = await readJsonResponse(
    signatureResponse,
    "Upload preparation service"
  );

  if (!signatureResponse.ok) {
    throw new Error(signatureData.error || "Unable to prepare the upload.");
  }

  const uploadData = new FormData();

  uploadData.append("file", file);
  uploadData.append("api_key", signatureData.apiKey);
  uploadData.append("timestamp", signatureData.timestamp);
  uploadData.append("folder", signatureData.folder);
  uploadData.append("signature", signatureData.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: uploadData,
    }
  );

  const uploaded = await readJsonResponse(uploadResponse, "Cloudinary upload");

  if (!uploadResponse.ok) {
    throw new Error(uploaded.error?.message || "Upload failed.");
  }

  return uploaded.secure_url;
}