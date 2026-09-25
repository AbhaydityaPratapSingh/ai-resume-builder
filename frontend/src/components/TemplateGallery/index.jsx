import { TEMPLATES } from "@resume-maker/shared";
import { useResumeStore } from "../../state/resumeStore.js";
import { useAppStore } from "../../state/appStore.js";
import { BEST_FOR } from "../../data/templateInfo.js";
import TemplateFlipCard from "../Landing/TemplateFlipCard.jsx";
import Tilt from "../Landing/Tilt.jsx";
import UploadResumeButton from "../Import/UploadResumeButton.jsx";
import "../Landing/landing.css";

export default function TemplateGallery() {
  const selected = useResumeStore((s) => s.resumeData.layout.templateId);
  const setTemplate = useResumeStore((s) => s.setTemplate);
  const setView = useAppStore((s) => s.setView);

  function choose(id) {
    setTemplate(id);
    setView("builder");
  }

  return (
    <div className="min-h-full bg-white text-slate-900">
      <nav className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-sm font-semibold">PerfectResume</span>
          <button
            onClick={() => setView("landing")}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            &larr; Back to home
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="gallery-rise text-center">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            Step 2 · Choose a look
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Pick a template to start with
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Both are single-column and ATS-safe, built to survive a resume parser as
            cleanly as a human reader. Flip a card to see who it fits best, and you can
            switch anytime without losing your content.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {TEMPLATES.map((template, i) => (
            <div
              key={template.id}
              className="gallery-rise relative"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {selected === template.id ? (
                <span className="absolute -top-3 left-4 z-10 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-sm">
                  Currently selected
                </span>
              ) : null}
              <TemplateFlipCard
                template={template}
                bestFor={BEST_FOR[template.id] || [template.description]}
                onUse={() => choose(template.id)}
              />
            </div>
          ))}
        </div>

        <div
          className="gallery-rise mt-14 flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left"
          style={{ animationDelay: `${TEMPLATES.length * 90}ms` }}
        >
          <div>
            <h2 className="font-semibold text-slate-900">Already have a resume?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload the PDF and we'll pull your details in. It starts on whichever
              template you last used, and you can switch templates anytime in the builder.
            </p>
          </div>
          <Tilt max={4} className="shrink-0 rounded-md">
            <UploadResumeButton />
          </Tilt>
        </div>
      </div>
    </div>
  );
}
