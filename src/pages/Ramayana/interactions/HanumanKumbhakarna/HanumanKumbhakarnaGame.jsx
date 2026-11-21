import { useCallback, useEffect, useRef } from "react";

import { createBattle } from "./battleEngine";

import "./HanumanKumbhakarnaGame.css";

/*
  Hanuman vs Kumbhakarna: a 90 second cinematic.

  Props
    onComplete  called when the player presses "Continue the chronicle"
    onExit      called when the player closes the cinematic (X button or Esc)

  Audio (served from /public)
    /audio/hanuman.mp3   plays while Hanuman grows
    /audio/roar.mp3      plays every time Kumbhakarna roars
    /audio/hanuman_chalisa.mp3   plays from start to end once WITNESS is pressed
  If a file is missing the game falls back to a synthesized sound.
*/

const HANUMAN_AUDIO = "/audio/hanuman.mp3";
const ROAR_AUDIO = "/audio/roar.mp3";
const CHALISA_AUDIO = "/audio/hanuman_chalisa.mp3";

export default function HanumanKumbhakarnaGame({ onComplete, onExit }) {
  const rootRef = useRef(null);
  const engineRef = useRef(null);
  const callbacks = useRef({ onComplete, onExit });
  callbacks.current = { onComplete, onExit };

  useEffect(() => {
    const engine = createBattle(rootRef.current, {
      hanumanSrc: HANUMAN_AUDIO,
      roarSrc: ROAR_AUDIO,
      chalisaSrc: CHALISA_AUDIO,
    });
    engineRef.current = engine;

    const onKey = (event) => {
      if (event.key === "Escape") {
        const { onExit: exit, onComplete: complete } = callbacks.current;
        (exit || complete)?.();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const start = useCallback(() => engineRef.current?.start(), []);

  const handleExit = useCallback(() => {
    const { onExit: exit, onComplete: complete } = callbacks.current;
    (exit || complete)?.();
  }, []);

  const handleContinue = useCallback(() => {
    const { onComplete: complete, onExit: exit } = callbacks.current;
    (complete || exit)?.();
  }, []);

  return (
    <div className="hkg" ref={rootRef}>
      <div id="vig" />
      <div id="grain" />
      <div id="flash" />

      <div id="bars">
        <i className="top" />
        <i className="bot" />
      </div>

      <div id="cap">
        <h2 id="capT" />
      </div>

      <div id="boot" className="card">
        <div className="in">
          <div className="eyebrow">Ancestra &middot; The Ramayana</div>

          <h1 className="big">
            Hanuman
            <br />
            &amp; Kumbhakarna
          </h1>

          <p className="lede">
            Witness the havoc and destruction of a fight between two giants.
          </p>

          <button type="button" className="btn" onClick={start}>
            WITNESS
          </button>
        </div>
      </div>

      <div id="end">
        <button type="button" className="btn" onClick={start}>
          WATCH AGAIN
        </button>

        <button type="button" className="btn btn--ghost" onClick={handleContinue}>
          CONTINUE THE CHRONICLE
        </button>
      </div>

      <button
        type="button"
        className="hkg-exit"
        onClick={handleExit}
        aria-label="Close the cinematic"
      >
        &#10005;
      </button>

      <div id="err" />
    </div>
  );
}