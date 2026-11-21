import { useEffect, useRef } from "react";
import { startDuel } from "./duelEngine2";

/* Fonts used by the in-game captions (loaded once). */
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Tiro+Devanagari+Hindi&display=swap";

function ensureFonts() {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[data-rama-ravana-fonts]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  link.setAttribute("data-rama-ravana-fonts", "1");
  document.head.appendChild(link);
}

/**
 * Rama vs Ravana — Part II: the 65-second finale (Brahmastra, the fall of Ravana).
 * Props: onExit / onComplete — both simply close the modal.
 * The shankh (conch) at the start is loaded from /audio/ramayana_theme.mp3
 * (put the file in your public/audio folder; a synthesized conch is used if it is missing).
 */
export default function RamaRavanaDuelPart2({ onExit, onComplete, themeUrl }) {
  const rootRef = useRef(null);

  useEffect(() => {
    ensureFonts();
    const handle = startDuel(rootRef.current, {
      themeUrl: themeUrl || "/audio/ramayana_theme.mp3",
    });
    return () => handle.dispose();
  }, [themeUrl]);

  const close = onExit || onComplete;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        background: "#000",
      }}
    >
      <div ref={rootRef} style={{ position: "absolute", inset: 0 }} />
      {close && (
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 100001,
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "1px solid rgba(255,207,106,.5)",
            background: "rgba(20,10,5,.65)",
            color: "#ffe6a8",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
