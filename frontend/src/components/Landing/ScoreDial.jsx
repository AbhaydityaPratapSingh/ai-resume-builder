import { useEffect, useState } from "react";
import { useTilt } from "./Tilt.jsx";
import { prefersReducedMotion, useInView } from "./useInView.js";

// Example numbers follow the architecture's formula:
// 70 × required + 20 × preferred + 10 × skills shown in bullets.
const SCORE = 82;
const BREAKDOWN = [
  { label: "Required skills", detail: "7 of 8 found", points: 61, max: 70 },
  { label: "Preferred skills", detail: "3 of 4 found", points: 15, max: 20 },
  { label: "Shown in your bullets", detail: "6 of 10 matched skills", points: 6, max: 10 },
];
const MISSING = [
  { name: "Docker", kind: "Critical", className: "bg-red-50 text-red-700 border-red-100" },
  { name: "Kubernetes", kind: "Nice to have", className: "bg-amber-50 text-amber-700 border-amber-100" },
];

const R = 80;
const C = 2 * Math.PI * R;
const EDGE_LAYERS = 8;

function useCountUp(target, run, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run, duration]);
  return value;
}

function Ring({ stroke, className = "", style }) {
  return (
    <svg viewBox="0 0 200 200" className={`absolute inset-0 h-full w-full ${className}`} style={style}>
      <circle cx="100" cy="100" r={R} fill="none" stroke={stroke} strokeWidth="18" />
    </svg>
  );
}

// A thick 3D coin: stacked rings give it an edge, the front ring fills to the
// score, and the missing-skill chips pop out in front once it is done.
function Dial({ run }) {
  const tilt = useTilt(16);
  const value = useCountUp(SCORE, run);

  return (
    <div {...tilt} className="dial3d mx-auto w-full max-w-xs py-6" aria-hidden="true">
      <div className="dial3d-scene aspect-square">
        {Array.from({ length: EDGE_LAYERS }, (_, i) => (
          <Ring
            key={i}
            stroke="#cbd5e1"
            style={{ transform: `translateZ(${-(EDGE_LAYERS - i) * 2}px)` }}
          />
        ))}
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <circle cx="100" cy="100" r={R} fill="none" stroke="#f1f5f9" strokeWidth="18" />
          <circle
            className="dial3d-progress"
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={run ? C * (1 - SCORE / 100) : C}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="text-5xl font-semibold tracking-tight text-slate-900">{value}%</span>
          <span className="mt-1 text-xs font-medium text-slate-500">JD match</span>
        </div>
        {MISSING.map((m, i) => (
          <span
            key={m.name}
            className={`dial3d-chip absolute rounded-md border px-2.5 py-1 text-xs font-medium shadow-lg ${m.className} ${
              i === 0 ? "-top-2 -right-6" : "-bottom-2 -left-6"
            }`}
            style={{
              transform: run ? "translateZ(80px) scale(1)" : "translateZ(0) scale(0.6)",
              opacity: run ? 1 : 0,
              transitionDelay: run ? `${1300 + i * 200}ms` : "0ms",
            }}
          >
            {m.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ScoreDial() {
  const [ref, inView] = useInView(0.4);

  return (
    <div ref={ref} className="grid items-center gap-12 lg:grid-cols-2">
      <Dial run={inView} />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          A score you can explain
        </h2>
        <p className="mt-3 text-slate-600">
          Your match score comes from clear rules, not guesswork. The same resume and JD always
          give the same number, and you can see exactly where every point comes from.
        </p>
        <dl className="mt-8 space-y-5">
          {BREAKDOWN.map((row, i) => (
            <div key={row.label}>
              <div className="flex items-baseline justify-between text-sm">
                <dt className="font-medium text-slate-900">
                  {row.label} <span className="font-normal text-slate-500">· {row.detail}</span>
                </dt>
                <dd className="tabular-nums text-slate-700">
                  {row.points} / {row.max}
                </dd>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="dial3d-bar h-2 rounded-full bg-indigo-600"
                  style={{
                    width: inView ? `${(row.points / row.max) * 100}%` : "0%",
                    transitionDelay: `${i * 150}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </dl>
        <div className="mt-8 text-sm font-medium text-slate-900">Missing skills</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MISSING.map((m) => (
            <span key={m.name} className={`rounded-md border px-2.5 py-1 text-xs ${m.className}`}>
              {m.name} · {m.kind}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
