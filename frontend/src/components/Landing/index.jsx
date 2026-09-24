import { Suspense, lazy, useEffect, useState } from "react";
import { TEMPLATES } from "@resume-maker/shared";
import { useResumeStore } from "../../state/resumeStore.js";
import { useAppStore } from "../../state/appStore.js";
import BuildSteps from "./BuildSteps.jsx";
import Hero3D from "./Hero3D.jsx";
import KeywordCloud from "./KeywordCloud.jsx";
import ScoreDial from "./ScoreDial.jsx";
import TemplateFlipCard from "./TemplateFlipCard.jsx";
import Tilt, { useTilt } from "./Tilt.jsx";
import UploadResumeButton from "../Import/UploadResumeButton.jsx";
import "./landing.css";

// three.js is only fetched when the backdrop is actually going to render.
const HeroBackdrop = lazy(() => import("./HeroBackdrop.jsx"));

const FEATURES = [
  {
    icon: "◧",
    title: "Live split-screen preview",
    body: "Edit on the left, see the exact PDF layout on the right as you type.",
  },
  {
    icon: "⌕",
    title: "JD keyword gap",
    body: "Missing skills split into critical and nice-to-have, plus eligibility checks like CGPA cutoffs.",
  },
  {
    icon: "◎",
    title: "Match score",
    body: "Same resume and JD, same score every time, with a breakdown that shows where it comes from.",
  },
  {
    icon: "✎",
    title: "Bullet tips",
    body: "Live hints like \"start with an action verb\" or \"add a number\". Your words are never rewritten for you.",
  },
  {
    icon: "✓",
    title: "ATS format check",
    body: "Rules-based checks warn you about missing details and ATS pitfalls before you download.",
  },
  {
    icon: "⇩",
    title: "One-click PDF",
    body: "Rendered from the same template as your live preview, so what you see is what you get.",
  },
];

const BEST_FOR = {
  classic: ["Most campus placement drives", "Service companies, banks and analyst roles"],
  modern: ["Product companies and startups", "SDE roles where a cleaner look stands out"],
};

const FAQ = [
  {
    q: "Who is this for?",
    a: "Final-year students heading into campus placements for SDE, analyst and trainee roles, and anyone who tailors a resume per job.",
  },
  {
    q: "Does it rewrite my resume?",
    a: "No. Your words stay yours. The app gives tips built from your own data and fixed rules, and you decide what to change. Nothing is rewritten automatically.",
  },
  {
    q: "Do I need an account?",
    a: "No. The builder works fully without one, and your resume is saved in your browser.",
  },
  {
    q: "Are the templates ATS-friendly?",
    a: "Yes. Every template is single-column with standard section headings, real text and no tables or images.",
  },
];

function canRenderWebGL() {
  const wide = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
  if (!wide.matches) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Landing() {
  const setView = useAppStore((s) => s.setView);
  const setTemplate = useResumeStore((s) => s.setTemplate);

  const ctaTilt = useTilt(6);
  const [showBackdrop, setShowBackdrop] = useState(false);

  useEffect(() => setShowBackdrop(canRenderWebGL()), []);

  const start = () => setView("gallery");

  function startWith(templateId) {
    setTemplate(templateId);
    setView("builder");
  }

  return (
    <div className="min-h-full overflow-x-clip bg-white text-slate-900">
      <nav className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-sm font-semibold">PerfectResume</span>
          <div className="flex items-center gap-6">
            <div className="hidden gap-6 text-sm text-slate-500 sm:flex">
              <a href="#how" className="hover:text-slate-900">How it works</a>
              <a href="#features" className="hover:text-slate-900">Features</a>
              <a href="#templates" className="hover:text-slate-900">Templates</a>
              <a href="#faq" className="hover:text-slate-900">FAQ</a>
            </div>
            <button
              onClick={start}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Build my resume
            </button>
          </div>
        </div>
      </nav>

      <div className="relative isolate">
        {showBackdrop ? (
          <Suspense fallback={null}>
            <HeroBackdrop />
          </Suspense>
        ) : null}
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              Built for campus placements
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Tailor your resume to every job description, in minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Paste the JD, see exactly which skills you're missing, strengthen your bullets
              with instant tips, and download an ATS-safe PDF.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={start}
                className="rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700"
              >
                Start building, it's free
              </button>
              <a
                href="#how"
                className="rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                See how it works
              </a>
              <UploadResumeButton />
            </div>
            <p className="mt-4 text-xs text-slate-400">
              No sign-up needed to start. Uploading a resume runs the PDF through a
              rule-based extractor — no API key needed there either.
            </p>
          </div>
          <Hero3D />
        </section>
      </div>

      <section id="how" className="scroll-mt-16 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
          <BuildSteps />
        </div>
      </section>

      <section id="features" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need to get shortlisted
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Tilt key={f.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <span className="tilt-pop flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  {f.icon}
                </span>
                <h3 className="tilt-pop mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{f.body}</p>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      <section id="score" className="scroll-mt-16 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <ScoreDial />
        </div>
      </section>

      <section id="templates" className="scroll-mt-16 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Templates</h2>
          <p className="mt-2 text-slate-600">
            Single-column and ATS-safe. Pick one to jump straight into the builder.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {TEMPLATES.map((template) => (
              <TemplateFlipCard
                key={template.id}
                template={template}
                bestFor={BEST_FOR[template.id] || [template.description]}
                onUse={() => startWith(template.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-16">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {item.q}
                  <span className="text-slate-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section {...ctaTilt} className="relative overflow-hidden bg-slate-900">
        <KeywordCloud />
        <div className="relative mx-auto max-w-6xl px-4 py-32 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Your next application deserves a tailored resume.
          </h2>
          <button
            onClick={start}
            className="mt-8 rounded-md bg-white px-5 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Build my resume
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400 sm:px-6">
          © {new Date().getFullYear()} PerfectResume
        </div>
      </footer>
    </div>
  );
}
