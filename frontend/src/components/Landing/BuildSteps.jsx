import { useEffect, useRef, useState } from "react";
import { useInView } from "./useInView.js";

const STEPS = [
  {
    title: "Pick a template",
    body: "Start from a single-column, ATS-safe layout. Switch anytime without losing content.",
  },
  {
    title: "Paste the job description",
    body: "See which skills the JD asks for that your resume is missing, and a match score.",
  },
  {
    title: "Improve and download",
    body: "Follow tips to strengthen your own bullets, then export a clean PDF an ATS can read.",
  },
];

const SECTIONS = [
  { name: "Education", lines: ["w-full", "w-10/12"] },
  { name: "Skills", lines: ["w-11/12", "w-7/12"], match: [0, 1] },
  { name: "Projects", lines: ["w-full", "w-11/12", "w-8/12"], match: [1] },
];

const JD_SKILLS = ["SQL", "React", "Docker"];

function part(visible, hidden, shown = "translate3d(0,0,0)") {
  return { transform: visible ? shown : hidden, opacity: visible ? 1 : 0 };
}

// Stage 0: the template assembles. Stage 1: JD skills fly in and matching
// lines light up. Stage 2: a PDF copy lifts off the page.
function BuildScene({ step }) {
  const [ref, built] = useInView(0.3);

  return (
    <div ref={ref} className="build3d mx-auto w-full max-w-sm py-8" aria-hidden="true">
      <div className="build3d-scene">
        <div
          className="build3d-part rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10"
          style={{ opacity: step === 2 ? 0.55 : 1 }}
        >
          <div
            className="build3d-part h-3 w-32 rounded bg-slate-900"
            style={part(built, "translate3d(0,-20px,60px)")}
          />
          <div className="mt-2 h-2 w-44 rounded bg-slate-200" />
          {SECTIONS.map((section, si) => (
            <div
              key={section.name}
              className="build3d-part mt-5"
              style={{
                ...part(built, "translate3d(0,24px,90px)"),
                transitionDelay: `${150 + si * 120}ms`,
              }}
            >
              <div className="text-[10px] font-semibold tracking-widest text-indigo-600 uppercase">
                {section.name}
              </div>
              <div className="mt-1.5 h-px bg-slate-200" />
              <div className="mt-2.5 space-y-2">
                {section.lines.map((w, li) => (
                  <div
                    key={li}
                    className={`build3d-part h-2 rounded ${w} ${
                      step >= 1 && section.match?.includes(li) ? "bg-indigo-300" : "bg-slate-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute -top-4 right-2 flex flex-col items-end gap-2 sm:-right-10">
          {JD_SKILLS.map((skill, i) => (
            <span
              key={skill}
              className="build3d-part rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
              style={{
                ...part(step >= 1, "translate3d(80px,-20px,0)", "translate3d(0,0,60px)"),
                transitionDelay: step >= 1 ? `${i * 120}ms` : "0ms",
              }}
            >
              {skill}
            </span>
          ))}
        </div>

        <div
          className="build3d-part absolute inset-x-6 top-10 rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
          style={part(
            step === 2,
            "translate3d(0,40px,0) rotateZ(0deg)",
            "translate3d(24px,-36px,110px) rotateZ(-4deg)"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded bg-slate-900" />
            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              PDF
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded bg-slate-100" />
            <div className="h-2 w-10/12 rounded bg-slate-100" />
            <div className="h-2 w-11/12 rounded bg-slate-100" />
            <div className="h-2 w-7/12 rounded bg-slate-100" />
          </div>
          <div className="mt-4 text-xs font-medium text-slate-500">resume.pdf ⇩</div>
        </div>
      </div>
    </div>
  );
}

export default function BuildSteps() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);
  const userPicked = useRef(false);

  // Wide screens: the step crossing the middle of the viewport drives the scene.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Narrow screens: the scene sits above the steps, so cycle it on a timer
  // until the user taps a step.
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const id = setInterval(() => {
      if (!userPicked.current) setActive((s) => (s + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  function pick(i) {
    userPicked.current = true;
    setActive(i);
  }

  return (
    <div className="mt-6 grid gap-6 lg:mt-0 lg:grid-cols-2 lg:gap-16">
      <ol>
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            ref={(el) => (stepRefs.current[i] = el)}
            data-step={i}
            className="py-2 lg:flex lg:min-h-[42vh] lg:items-center"
          >
            <button
              type="button"
              onClick={() => pick(i)}
              aria-pressed={active === i}
              className={`w-full rounded-xl border p-5 text-left transition ${
                active === i
                  ? "border-slate-900 bg-white shadow-lg"
                  : "border-transparent hover:border-slate-200"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  active === i ? "bg-indigo-600 text-white" : "bg-slate-900 text-white"
                }`}
              >
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{step.body}</p>
            </button>
          </li>
        ))}
      </ol>
      <div className="order-first lg:order-none">
        <div className="lg:sticky lg:top-[calc(50vh-14rem)]">
          <BuildScene step={active} />
        </div>
      </div>
    </div>
  );
}
