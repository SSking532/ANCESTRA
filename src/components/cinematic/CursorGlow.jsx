import { useEffect, useState } from "react";

function CursorGlow() {
  const [position, setPosition] = useState({
    x: -500,
    y: -500,
  });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="cursor-glow"
      style={{
        transform: `translate3d(${position.x - 180}px, ${
          position.y - 180
        }px, 0)`,
      }}
    />
  );
}

export default CursorGlow;