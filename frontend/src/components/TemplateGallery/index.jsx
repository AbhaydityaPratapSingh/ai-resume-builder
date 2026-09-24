import { TEMPLATES, renderResumeHTML } from "@resume-maker/shared";
import { useResumeStore } from "../../state/resumeStore.js";
import { useAppStore } from "../../state/appStore.js";
import { SAMPLE_RESUME } from "../../data/sampleResume.js";

export default function TemplateGallery() {
  const selected = useResumeStore((s) => s.resumeData.layout.templateId);
  const setTemplate = useResumeStore((s) => s.setTemplate);
  const setView = useAppStore((s) => s.setView);

  function choose(id) {
    setTemplate(id);
    setView("builder");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <button
        onClick={() => setView("landing")}
        className="mb-6 text-sm text-slate-500 hover:text-slate-900"
      >
        &larr; Back
      </button>
      <h1 className="text-2xl font-semibold text-slate-900">Pick a template</h1>
      <p className="mt-1 text-sm text-slate-500">
        Both are single-column and ATS-safe. You can switch later without losing content.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => choose(template.id)}
            className={`group overflow-hidden rounded-xl border-2 bg-white text-left transition ${
              selected === template.id
                ? "border-slate-900"
                : "border-slate-200 hover:border-slate-400"
            }`}
          >
            <div className="relative h-64 overflow-hidden bg-white">
              <iframe
                title={template.name}
                srcDoc={renderResumeHTML(SAMPLE_RESUME, template.id)}
                sandbox=""
                scrolling="no"
                className="absolute top-0 left-0 origin-top-left"
                style={{
                  width: "200%",
                  height: "200%",
                  border: "none",
                  background: "white",
                  transform: "scale(0.5)",
                  pointerEvents: "none",
                }}
              />
            </div>
            <div className="border-t border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">{template.name}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
