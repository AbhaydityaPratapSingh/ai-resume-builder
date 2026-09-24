const KEYWORDS = [
  "SQL", "React", "Java", "Python", "Docker", "Power BI", "Excel", "Node.js",
  "DSA", "Git", "REST APIs", "Spring Boot", "C++", "Tableau", "AWS", "MongoDB",
  "Machine Learning", "Linux",
];

// Small seeded PRNG so the layout is the same on every render and every visit.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(7);
const CHIPS = KEYWORDS.map((word, i) => {
  const z = Math.round(-200 + rand() * 300);
  // Chips live in a top and a bottom band, keeping the middle clear for the
  // heading and button (perspective pulls far chips toward the centre).
  const top = i % 2 === 0 ? 4 + rand() * 18 : 76 + rand() * 16;
  return {
    word,
    left: `${(2 + rand() * 88).toFixed(1)}%`,
    top: `${top.toFixed(1)}%`,
    z: `${z}px`,
    dx: `${Math.round(-30 + rand() * 60)}px`,
    dy: `${Math.round(-12 + rand() * 24)}px`,
    dur: `${(9 + rand() * 8).toFixed(1)}s`,
    delay: `${(-rand() * 10).toFixed(1)}s`,
    // Nearer chips are brighter, farther ones fade into the background.
    opacity: (0.25 + ((z + 200) / 300) * 0.6).toFixed(2),
  };
});

export default function KeywordCloud() {
  return (
    <div className="kw-cloud pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="kw-cloud-scene">
        {CHIPS.map((c, i) => (
          <span
            key={c.word}
            className={`kw-chip rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm whitespace-nowrap text-white ${
              i % 3 === 2 ? "hidden sm:block" : ""
            }`}
            style={{
              left: c.left,
              top: c.top,
              opacity: c.opacity,
              "--z": c.z,
              "--dx": c.dx,
              "--dy": c.dy,
              "--dur": c.dur,
              "--delay": c.delay,
            }}
          >
            {c.word}
          </span>
        ))}
      </div>
    </div>
  );
}
