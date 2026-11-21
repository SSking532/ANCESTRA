import ParticleField from "./ParticleField";
import CursorGlow from "./CursorGlow";

function AmbientBackground() {
  return (
    <div className="ambient-background">
      <div className="ambient-background__base" />

      <div className="ambient-background__gradient ambient-background__gradient--gold" />
      <div className="ambient-background__gradient ambient-background__gradient--maroon" />

      <ParticleField count={85} />

      <CursorGlow />

      <div className="ambient-vignette" />
      <div className="ambient-grain" />
    </div>
  );
}

export default AmbientBackground;