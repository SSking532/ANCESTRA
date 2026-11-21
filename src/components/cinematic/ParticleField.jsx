import { useEffect, useRef } from "react";

function ParticleField({ count = 70 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const particles = [];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");

      particle.className = "ancestra-particle";

      const size = Math.random() * 2.5 + 0.5;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = Math.random() * 8 + 6;
      const delay = Math.random() * -10;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${left}%`;
      particle.style.top = `${top}%`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;

      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach((particle) => particle.remove());
    };
  }, [count]);

  return <div ref={containerRef} className="particle-field" />;
}

export default ParticleField;