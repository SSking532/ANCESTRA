import { useEffect, useRef } from "react";
import * as THREE from "three";

import "./KumbhakarnaFinalBattle.css";

import { initKumbhakarnaGame } from "./kumbhakarnaEngine";

/* =========================================================
   KUMBHAKARNA — THE FINAL BATTLE
   Props:
     onComplete()  called from "CONTINUE THE STORY"
     onExit()      called from the EXIT button
   Optional roar audio: /public/audio/roar.mp3
========================================================= */

export default function KumbhakarnaFinalBattle({
  onComplete,
  onExit,
}) {
  const rootRef = useRef(null);
  const callbacks = useRef({ onComplete, onExit });
  callbacks.current = { onComplete, onExit };

  useEffect(() => {
    const stop = initKumbhakarnaGame(rootRef.current, THREE, {
      onComplete: () => callbacks.current.onComplete?.(),
      onExit: () => callbacks.current.onExit?.(),
    });
    return stop;
  }, []);

  return (
    <div className="kfb" ref={rootRef}>
      <div id="stage"></div>
      <div className="ov" id="vig"></div>
      <div className="ov" id="hitflash"></div>
      <div className="ov" id="grace"></div>
      <div id="bars"><i></i><i></i></div>
      <div id="cap"><div className="hi"></div><div className="en"></div><div className="sm"></div></div>
      <div id="subs"></div>
      <div id="np"><div className="hi"></div><div className="en"></div><div className="sm"></div></div>
      <div id="toast"></div>
      <div id="hud">
        <div id="boss">
          <div className="nm"><span className="hi">कुम्भकर्ण</span><span className="en">KUMBHAKARNA</span></div>
          <div className="bar"><div className="lag" id="bLag"></div><div className="fill" id="bFill"></div><span className="notch" style={{left:"33.3%"}}></span><span className="notch" style={{left:"66.6%"}}></span></div>
        </div>
        <div id="radarW"><canvas id="radar" width="224" height="224"></canvas></div>
        <div id="ramaHud">
          <div><span className="hi">राम</span><span className="en">DIVINE GRACE</span></div>
          <div className="bar"><div className="lag" id="rLag"></div><div className="fill" id="rFill"></div></div>
          <div className="bar" id="div"><div className="fill" id="dFill" style={{width:"0%"}}></div></div>
          <div id="divTxt">AGNEYASTRA 0%</div>
        </div>
        <div id="hint"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> CIRCLE THE GIANT<br /><kbd>SPACE</kbd> DODGE ROLL<br /><kbd>CLICK</kbd> / <kbd>J</kbd> LOOSE ARROW<br /><kbd>Q</kbd> DIVINE ARROW</div>
      </div>
      <div id="touch"><div id="joy"><i></i></div><div className="tb" id="bShoot">SHOOT</div><div className="tb" id="bRoll">ROLL</div><div className="tb" id="bDiv">ASTRA</div></div>
      <button id="skip" type="button">SKIP</button>
      <button className="kfb-exit" id="exitBtn" type="button">{"\u2715"} EXIT</button>
      <div className="ov" id="fade"></div>
      <div id="menu">
        <div className="k">THE FINAL BATTLE OF</div>
        <h1>KUMBHAKARNA</h1>
        <div className="hi">राम बनाम कुम्भकर्ण</div>
        <p>Kumbhakarna still stands. Rama steps forward. Two warriors, two duties, one destined ending.</p>
        <button className="btn" id="begin" type="button">BEGIN</button>
        <div className="ctl"><kbd>W A S D</kbd> move {"\u00A0"} <kbd>SPACE</kbd> dodge {"\u00A0"} <kbd>CLICK</kbd> arrow {"\u00A0"} <kbd>Q</kbd> divine arrow<br />Sound on. Headphones recommended.</div>
      </div>
      <div id="end" className="off">
        <div className="k">THE END OF A GIANT</div>
        <div className="big">THE GIANT FELL.<br />BUT A BROTHER WHO STOOD FOR <em>DHARMA</em> HAS DIED.</div>
        <div className="sub">He had urged Ravana to return Sita. When Ravana refused, Kumbhakarna chose loyalty over life, and met Rama as a warrior should.</div>
        <div className="row"><button className="btn" id="again" type="button">FACE HIM AGAIN</button><button className="btn kfb-ghost" id="doneBtn" type="button">CONTINUE THE STORY</button></div>
      </div>
    </div>
  );
}
