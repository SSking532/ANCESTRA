import React from "react";
import "./LakshmanaVsIndrajitGame.css";

/*
  ANCESTRA: Lakshmana vs Indrajit.

  index.html is a single self-contained file (three.js is inlined), so it is
  imported as raw text and shown through iframe `srcDoc`. This means the game
  works from where it sits inside src/. No public/ folder or URL is needed.

  Requires Vite (the "?raw" import suffix).

  Usage:
    <LakshmanaVsIndrajitGame onExit={close} />
*/
import gameHtml from "./index.html?raw";

export default function LakshmanaVsIndrajitGame({ onExit, onComplete }) {
  const exit = onExit || onComplete;

  return (
    <div className="lvi-wrap">
      <iframe
        className="lvi-frame"
        srcDoc={gameHtml}
        title="Lakshmana vs Indrajit"
        allow="fullscreen"
      />
      {exit && (
        <button
          className="lvi-exit"
          type="button"
          aria-label="Exit game"
          onClick={exit}
        >
          ×
        </button>
      )}
    </div>
  );
}
