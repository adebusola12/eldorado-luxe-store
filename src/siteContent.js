import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// What the website shows until the owner edits it in the admin.
export const DEFAULT_FOUNDER = {
  name: "The Founder",
  title: "Founder and master tailor, ELDORADO LUXE",
  intro:
    "Every piece that leaves our studio carries my name and my standards.",
  story:
    "ELDORADO LUXE, The Lungu Tailor, celebrates Nigerian traditional menswear, from the Agbada to the Senator, Kaftan, Two-Piece and Dansiki.\n\nEach outfit is cut with care and finished to last, so the man who wears it walks into the room with presence and confidence.\n\nWhether it is a wedding, a celebration or an everyday statement, we would love to dress you.",
  image_url: "",
};

// Reads the founder text and collection details the owner saved in the admin.
export function useSiteContent() {
  const [founder, setFounder] = useState(DEFAULT_FOUNDER);
  const [collectionInfo, setCollectionInfo] = useState({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error || !data || !mounted) return;

      data.forEach((row) => {
        if (row.key === "founder" && row.value) {
          setFounder({ ...DEFAULT_FOUNDER, ...row.value });
        }

        if (row.key === "collections" && row.value) {
          setCollectionInfo(row.value);
        }
      });
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { founder, collectionInfo };
}