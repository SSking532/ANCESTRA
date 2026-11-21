import { useEffect, useRef } from "react";
import { createKumbhakarnaGame } from "./kumbhakarnaEngine";
import "./KumbhakarnaAwakening.css";

/**
 * Chapter XVI: "Awaken Kumbhakarna".
 *
 * Props
 *  - onComplete : called when the player presses "Continue the story"
 *  - onExit     : called when the player presses "Exit"
 *  - conchUrl   : URL of the shankh sound (default /audio/shankh.mp3 -> public/audio/shankh.mp3)
 *  - roarUrl    : URL of the awakening roar (default /audio/roar.mp3 -> public/audio/roar.mp3)
 */
export default function KumbhakarnaAwakening({
  onComplete,
  onExit,
  conchUrl = "/audio/shankh.mp3",
  roarUrl = "/audio/roar.mp3",
}) {
  const rootRef = useRef(null);
  const callbacks = useRef({ onComplete, onExit });
  callbacks.current = { onComplete, onExit };

  useEffect(() => {
    const dispose = createKumbhakarnaGame(rootRef.current, {
      onComplete: () => callbacks.current.onComplete && callbacks.current.onComplete(),
      onExit: () => callbacks.current.onExit && callbacks.current.onExit(),
      conchUrl,
      roarUrl,
    });
    return dispose;
  }, [conchUrl, roarUrl]);

  return <div ref={rootRef} className="kk-root" />;
}
