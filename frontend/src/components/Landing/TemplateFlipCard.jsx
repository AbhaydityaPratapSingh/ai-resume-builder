import { useState } from "react";
import { renderResumeHTML } from "@resume-maker/shared";
import { SAMPLE_RESUME } from "../../data/sampleResume.js";

const TRAITS = ["Single column", "Real text, no tables or images", "Switch anytime, keep your content"];

// Front: live preview of the template. Back: what it suits best. Flips on a
// button press (not hover) so it works the same with touch and keyboard.
export default function TemplateFlipCard({ template, bestFor, onUse }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flip-card h-[23rem]" data-flipped={flipped}>
      <div className="flip-inner relative h-full">
        <div
          className="flip-face absolute inset-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-400 hover:shadow-xl"
          inert={flipped}
        >
          <button
            type="button"
            onClick={onUse}
            className="block h-full w-full text-left"
            aria-label={`Use the ${template.name} template`}
          >
            <div className="relative h-72 overflow-hidden bg-white">
              <iframe
                title={template.name}
                srcDoc={renderResumeHTML(SAMPLE_RESUME, template.id)}
                sandbox=""
                scrolling="no"
                tabIndex={-1}
                className="absolute top-0 left-0 origin-top-left"
                style={{
                  width: "200%",
                  height: "200%",
                  border: "none",
                  transform: "scale(0.5)",
                  pointerEvents: "none",
                }}
              />
            </div>
            <div className="border-t border-slate-200 px-5 py-4">
              <h3 className="font-semibold">{template.name}</h3>
              <p className="mt-0.5 text-sm text-slate-500">{template.description}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="absolute top-3 right-3 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-white"
          >
            Best for ↻
          </button>
        </div>

        <div
          className="flip-face flip-back absolute inset-0 flex flex-col rounded-xl bg-slate-900 p-6 text-white"
          inert={!flipped}
        >
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <div className="mt-5 text-xs font-semibold tracking-widest text-indigo-300 uppercase">
            Best for
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
            {bestFor.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <div className="mt-5 text-xs font-semibold tracking-widest text-indigo-300 uppercase">
            Every template
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
            {TRAITS.map((t) => (
              <li key={t}>✓ {t}</li>
            ))}
          </ul>
          <div className="mt-auto flex gap-2 pt-5">
            <button
              type="button"
              onClick={onUse}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Use {template.name}
            </button>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              ↺ Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
