import { useEffect, useState } from "react";
import { getMediaObjectUrl, revokeObjectUrl } from "./mediaStore";

export function useMediaObjectUrl(media) {
  const [resolvedUrl, setResolvedUrl] = useState("");

  useEffect(() => {
    const directUrl = media?.objectUrl || media?.src || "";
    if (directUrl) {
      setResolvedUrl(directUrl);
      return undefined;
    }

    const storage = String(media?.storage || "");
    const mediaId = media?.indexedDbKey || media?.id;
    if (storage !== "indexeddb" || !mediaId) {
      setResolvedUrl("");
      return undefined;
    }

    let cancelled = false;
    let generatedUrl = "";

    getMediaObjectUrl(mediaId)
      .then((url) => {
        if (!url) {
          setResolvedUrl("");
          return;
        }
        if (cancelled) {
          revokeObjectUrl(url);
          return;
        }
        generatedUrl = url;
        setResolvedUrl(url);
      })
      .catch(() => {
        setResolvedUrl("");
      });

    return () => {
      cancelled = true;
      if (generatedUrl) revokeObjectUrl(generatedUrl);
    };
  }, [media?.id, media?.indexedDbKey, media?.objectUrl, media?.src, media?.storage]);

  return resolvedUrl;
}
