import { useCallback, useEffect, useRef, useState } from "react";

import { createJambavanRavana } from "./jambavanRavanaEngine";

import "./JambavanRavanaGame.css";

/*
  Jambavan vs Ravana: a continuous cinematic battle (Chapter XIX).
  Starts at the memory of Jatayu and ends when Jambavan hurls Ravana into his chariot.

  Props
    onComplete  called when the player presses "Continue the chronicle"
    onExit      called when the player closes the cinematic (X button or Esc)

  Voices use the browser's built-in speech synthesis. No audio files are required.
*/

export default function JambavanRavanaGame({ onComplete, onExit }) {
  const rootRef = useRef(null);
  const engineRef = useRef(null);
  const callbacks = useRef({ onComplete, onExit });
  callbacks.current = { onComplete, onExit };
  const [run, setRun] = useState(0);

  useEffect(() => {
    const engine = createJambavanRavana(rootRef.current);
    engineRef.current = engine;
    if (run > 0) engine.start();

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
  }, [run]);

  const start = useCallback(() => engineRef.current?.start(), []);
  const toggleSound = useCallback(() => engineRef.current?.toggleSound(), []);
  const restart = useCallback(() => setRun((n) => n + 1), []);

  const handleExit = useCallback(() => {
    const { onExit: exit, onComplete: complete } = callbacks.current;
    (exit || complete)?.();
  }, []);

  const handleContinue = useCallback(() => {
    const { onComplete: complete, onExit: exit } = callbacks.current;
    (complete || exit)?.();
  }, []);

  return (
    <div className="jrg" key={run} ref={rootRef}>
      <div id="vg" />
      <div id="fl" />
      <div className="bar t" />
      <div className="bar b" />

      <button type="button" id="mu" onClick={toggleSound} aria-label="Toggle sound">
        &#9834;
      </button>
      <button type="button" id="ex" onClick={handleExit} aria-label="Exit the battle">
        &#10005;
      </button>

      <div id="sub">
        <div id="who" />
        <div id="txt" />
      </div>

      <div className="scr" id="start">
        <div className="k1">ANCESTRA &middot; THE RAMAYANA</div>
        <h1>
          JAMBAVAN<span>AGAINST</span>RAVANA
        </h1>
        <q>Witness the fury of two legends before the golden gates of Lanka.</q>
        <button type="button" id="go" onClick={start}>
          WITNESS
        </button>
      </div>

      <div className="scr" id="end">
        <div className="k1">CHAPTER XIX</div>
        <h1 style={{ fontSize: "clamp(30px,6.4vw,78px)" }}>JAMBAVAN HAS PREVAILED</h1>
        <q>The strength of a warrior is not measured by the fear he commands, but by the purpose he serves.</q>
        <div className="btns">
          <button type="button" id="rs" onClick={restart}>
            WATCH AGAIN
          </button>
          <button type="button" className="ghost" onClick={handleContinue}>
            CONTINUE THE CHRONICLE
          </button>
        </div>
      </div>
    </div>
  );
}
