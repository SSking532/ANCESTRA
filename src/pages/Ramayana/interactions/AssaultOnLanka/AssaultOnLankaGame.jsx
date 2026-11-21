/* =====================================================================
   ANCESTRA · CHAPTER XV · GAME I — "THE FIRST CLASH"
   Files in this folder:  AssaultOnLankaGame.jsx  AssaultOnLankaGame.css  engine.js  audio.js
   Needs: react, react-dom, three.
   Props:  onComplete()  → player chose "Continue the story"
           onExit()      → player pressed Exit / Leave battle
   The game is rendered through a portal into <body>, so it always fills the
   whole screen, whatever transform / overflow / layout its parent has.
   ===================================================================== */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./AssaultOnLankaGame.css";
import { makeSound } from "./audio.js";
import { createGame } from "./engine.js";

const Ico = {
  gada: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 27 16 17" /><circle cx="21" cy="11" r="6.5" /><path d="M21 2v3M30 11h-3M21 20v-3M12 11h3M27.5 4.5l-2 2M27.5 17.5l-2-2M14.5 4.5l2 2" /></svg>,
  stone: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 20 14 8l9 2 4 9-7 6-8-1z" /><path d="M14 8l4 8 9 3M18 16l2 9M8 20l10-4" /></svg>,
  leap: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 14 16 6l8 8M8 23l8-8 8 8" /></svg>,
  slam: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4v13M10 12l6 6 6-6" /><ellipse cx="16" cy="24" rx="12" ry="4" /><ellipse cx="16" cy="24" rx="6" ry="1.8" /></svg>,
};

export default function AssaultOnLankaGame({ onComplete, onExit }) {
  const rootRef = useRef(null), gameRef = useRef(null), sndRef = useRef(null);
  const [phase, setPhase] = useState("menu");
  const [end, setEnd] = useState(null);
  const [muted, setMuted] = useState(false);
  const exitRef = useRef(onExit), doneRef = useRef(onComplete);
  exitRef.current = onExit; doneRef.current = onComplete;

  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const snd = makeSound(); sndRef.current = snd;
    const g = createGame(rootRef.current, { phase: setPhase, end: setEnd }, snd); gameRef.current = g;
    const onKey = (e) => { if (e.code === "KeyM") setMuted((m) => { snd.setMuted(!m); return !m; }); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); g.dispose(); snd.dispose(); document.body.style.overflow = prev; };
  }, []);

  const leave = useCallback(() => { if (exitRef.current) exitRef.current(); }, []);
  const playing = phase === "intro" || phase === "play";
  const toggleMute = () => setMuted((m) => { sndRef.current.setMuted(!m); return !m; });
  const K = ({ children }) => <kbd className="alk-k">{children}</kbd>;
  const fmt = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

  const tree = (
    <div className="alk" ref={rootRef} role="dialog" aria-label="The First Clash — Battle of Lanka">
      <div className="alk-mount" data-h="mount" />
      <div className="alk-grade" />
      <div className="alk-vig" data-h="vig" />
      <div className="alk-bars"><i /><i /></div>
      <div className="alk-dn-l" data-h="dn" />

      <div className="alk-hud" style={{ display: phase === "menu" ? "none" : "block" }}>
        <div className="alk-panel">
          <div className="alk-crest" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M4 22 7 10l6 6 3-8 3 8 6-6 3 12z" /><path d="M5 26h22" /></svg>
          </div>
          <div className="alk-pbody">
            <div className="alk-nm"><span>Vanara Champion</span><span data-h="hpt">130</span></div>
            <div className="alk-bar"><i data-h="hp" /><u /></div>
            <div className="alk-sk">
              <div data-h="k0"><s>{Ico.gada}</s><b>Gada</b><em>LMB</em></div>
              <div data-h="k1"><s>{Ico.stone}</s><b>Stone</b><em>RMB</em></div>
              <div><s>{Ico.leap}</s><b>Leap</b><em>Space ×2</em></div>
              <div data-h="k2"><s>{Ico.slam}</s><b>Slam</b><em>F</em></div>
            </div>
          </div>
        </div>

        <div className="alk-wv">
          <div className="alk-pips" aria-hidden="true"><i /><i /><i /></div>
          <b data-h="wvt">Wave I</b>
          <span data-h="wvs" />
          <div className="alk-wp"><i data-h="wvp" /></div>
        </div>

        <div className="alk-cmb" data-h="cmb"><b data-h="cmbn">×2</b><span>Combo</span></div>
        <div className="alk-radar"><canvas data-h="rad" width="220" height="220" /></div>
        <div className="alk-ban" data-h="ban"><h2 data-h="bt" /><p data-h="bs" /></div>
        <div className="alk-hint" data-h="hint">Move with W A S D (Shift to sprint)</div>
      </div>

      <div className="alk-top">
        <button type="button" className="alk-ib m" onClick={toggleMute} aria-label="Toggle sound">{muted ? "🔇 Sound off" : "🔊 Sound on"}</button>
        <button type="button" className="alk-ib" aria-label="Exit game" onClick={() => { if (phase === "play") gameRef.current.pause(); else leave(); }}>✕ Exit</button>
      </div>

      <div className="alk-touch" style={{ display: playing ? undefined : "none" }}>
        <div className="alk-look" data-h="look" />
        <div className="alk-stk" data-h="stk"><div className="alk-knob" data-h="knob" /></div>
        <button className="alk-tb" data-h="bA" style={{ right: 24, bottom: 110 }}>Gada</button>
        <button className="alk-tb" data-h="bS" style={{ right: 98, bottom: 60 }}>Stone</button>
        <button className="alk-tb" data-h="bJ" style={{ right: 24, bottom: 30 }}>Leap</button>
        <button className="alk-tb" data-h="bF" style={{ right: 98, bottom: 136 }}>Slam</button>
      </div>

      {phase === "menu" && (
        <div className="alk-scr menu">
          <div className="alk-orn" aria-hidden="true"><i /><span>✦</span><i /></div>
          <h1>The First Clash</h1>
          <p className="alk-sub">Chapter XV · The Battle of Lanka</p>
          <div className="alk-obj"><b>Defeat 3 waves</b> of Rakshasas and giants. Stay alive.</div>
          <div className="alk-grid">
            <div><K>W</K><K>A</K><K>S</K><K>D</K><span>Move</span></div>
            <div><K>Shift</K><span>Sprint</span></div>
            <div><K>LMB</K><K>J</K><span>Swing gada</span></div>
            <div><K>RMB</K><K>K</K><span>Throw stone</span></div>
            <div><K>Space</K><span>Jump · twice = leap</span></div>
            <div><K>F</K><span>Ground slam</span></div>
            <div><K>Mouse</K><K>Q</K><K>E</K><span>Camera</span></div>
            <div><K>Esc</K><K>M</K><span>Pause · Sound</span></div>
          </div>
          <div className="alk-tnote">Touch: left stick moves, drag right side to look, tap the round buttons to fight.</div>
          <div className="alk-act"><button type="button" className="alk-btn" onClick={() => gameRef.current.start()}>Enter the battle</button><button type="button" className="alk-btn alt" onClick={leave}>Not now</button></div>
        </div>
      )}
      {phase === "pause" && (
        <div className="alk-scr"><h1>Battle paused</h1><p>Rest a moment, warrior.</p>
          <div className="alk-act"><button type="button" className="alk-btn" onClick={() => gameRef.current.resume()}>Resume</button><button type="button" className="alk-btn alt" onClick={leave}>Leave battle</button></div></div>
      )}
      {phase === "win" && end && (
        <div className="alk-scr win"><div className="alk-orn" aria-hidden="true"><i /><span>✦</span><i /></div><h1>Lanka’s first assault is broken</h1>
          <p>Rama’s army holds the field.</p>
          <div className="alk-stats"><div><b>{end.kills}</b><span>Foes slain</span></div><div><b>×{end.combo || 0}</b><span>Best combo</span></div><div><b>{fmt(end.time || 0)}</b><span>Time</span></div></div>
          <div className="alk-act"><button type="button" className="alk-btn" onClick={() => doneRef.current && doneRef.current()}>Continue the story</button><button type="button" className="alk-btn alt" onClick={() => gameRef.current.keepFighting()}>Keep fighting</button></div></div>
      )}
      {phase === "lose" && end && (
        <div className="alk-scr lose"><h1>The vanara fall</h1>
          <p>Rise again, warrior.</p>
          <div className="alk-stats"><div><b>{end.kills}</b><span>Foes slain</span></div><div><b>{rom(end.wave)}</b><span>Wave reached</span></div><div><b>×{end.combo || 0}</b><span>Best combo</span></div></div>
          <div className="alk-act"><button type="button" className="alk-btn" onClick={() => gameRef.current.restart()}>Fight again</button><button type="button" className="alk-btn alt" onClick={leave}>Leave battle</button></div></div>
      )}
    </div>
  );

  /* Portal → <body>: guarantees full-screen even inside transformed / clipped parents. */
  return typeof document !== "undefined" ? createPortal(tree, document.body) : tree;
}

function rom(n) { return ["", "I", "II", "III", "IV", "V"][n] || n; }