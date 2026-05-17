import { useEffect, useRef, useState } from "react";
import ReactionOverlay from "./ReactionOverlay";

export default function ReactionOverlayHost() {
  const [overlays, setOverlays] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    function handleReaction(event) {
      const detail = event.detail || {};
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const overlayDuration = detail.reaction?.overlayDuration || 1900;
      const nextOverlay = {
        id,
        reaction: detail.reaction,
        rect: detail.rect,
      };

      setOverlays((current) => [...current.slice(-5), nextOverlay]);
      const timer = window.setTimeout(() => {
        setOverlays((current) => current.filter((overlay) => overlay.id !== id));
      }, overlayDuration + 120);
      timers.current.push(timer);
    }

    window.addEventListener("twtaf:reaction-overlay", handleReaction);
    return () => {
      window.removeEventListener("twtaf:reaction-overlay", handleReaction);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, []);

  return overlays.map((overlay) => (
    <ReactionOverlay key={overlay.id} reaction={overlay.reaction} rect={overlay.rect} />
  ));
}
