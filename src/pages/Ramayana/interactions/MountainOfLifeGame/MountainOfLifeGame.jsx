import { useEffect, useRef } from "react";
import gameHtml from "./gameHtml";
import "./MountainOfLifeGame.css";

/**
 * Chapter XVII — "The Mountain of Life"
 * Full-screen 3D game (Hanuman lifts the Sanjeevani mountain).
 * The game is bundled in ./gameHtml.js (no public folder or URL needed)
 * and is embedded in an iframe so its Three.js code never touches your app bundle.
 *
 * Props (any of these closes the game, so it matches your other interactions):
 *   onComplete  called when the player reaches the end / presses "Continue the story"
 *   onExit      called when the player presses the X button or Esc
 *   onClose     alias of onExit
 */
export default function MountainOfLifeGame({
  onComplete,
  onExit,
  onClose,
}) {
  const frameRef = useRef(null);
  const exit = onExit || onClose || onComplete;

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === "mountain-of-life" && e.data.event === "complete") {
        onComplete?.();
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") exit?.();
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onComplete, exit]);

  return (
    <div className="mountain-of-life" role="dialog" aria-modal="true" aria-label="The Mountain of Life">
      <iframe
        ref={frameRef}
        className="mountain-of-life__frame"
        srcDoc={gameHtml}
        title="The Mountain of Life"
        allow="autoplay; fullscreen"
        onLoad={() => frameRef.current?.contentWindow?.focus()}
      />
      <button
        type="button"
        className="mountain-of-life__close"
        onClick={() => exit?.()}
        aria-label="Close game"
      >
        ✕
      </button>
    </div>
  );
}
