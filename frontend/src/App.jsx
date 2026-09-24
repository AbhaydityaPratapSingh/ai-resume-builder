import { useEffect, useRef, useState } from "react";
import { TEMPLATES } from "@resume-maker/shared";

import Landing from "./components/Landing/index.jsx";
import TemplateGallery from "./components/TemplateGallery/index.jsx";
import ImportReview from "./components/Import/ImportReview.jsx";
import FormPanel from "./components/Builder/FormPanel/index.jsx";
import PreviewPanel from "./components/Builder/PreviewPanel/index.jsx";
import JDInput from "./components/Builder/JDInput.jsx";
import { Button } from "./components/shared/ui.jsx";
import { useResumeStore } from "./state/resumeStore.js";
import { useAppStore } from "./state/appStore.js";
import { downloadPDF, getHealth, validateATS } from "./api/client.js";

function BackupMenu() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const replaceResume = useResumeStore((s) => s.replaceResume);
  const fileRef = useRef(null);
  const [error, setError] = useState(null);

  function handleBackup() {
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleRestore(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || !parsed.personal) {
        throw new Error("That file does not look like a resume backup.");
      }
      replaceResume(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" className="px-2 py-1 text-xs" onClick={handleBackup}>
        Backup
      </Button>
      <Button
        variant="ghost"
        className="px-2 py-1 text-xs"
        onClick={() => fileRef.current?.click()}
      >
        Restore
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleRestore}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}

function Header() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const setTemplate = useResumeStore((s) => s.setTemplate);
  const setView = useAppStore((s) => s.setView);
  const backendUp = useAppStore((s) => s.backendUp);
  const atsReport = useAppStore((s) => s.atsReport);
  const setAtsReport = useAppStore((s) => s.setAtsReport);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownload() {
    setBusy(true);
    setError(null);
    try {
      const preReport = await validateATS(resumeData);
      setAtsReport(preReport);
      // Post-render checks look at the actual PDF bytes (section order,
      // extractable name/email, page count) — a different, later signal
      // than the pre-render content rules above, so the two reports are
      // merged rather than one replacing the other.
      const postReport = await downloadPDF(resumeData, resumeData.layout.templateId);
      setAtsReport({
        ok: preReport.ok && postReport.warnings.length === 0,
        warnings: [...preReport.warnings, ...postReport.warnings],
        info: [...preReport.info, ...postReport.info],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setView("gallery")}
          className="text-sm font-semibold text-slate-900 hover:text-slate-600"
        >
          Resume Builder
        </button>
        <select
          value={resumeData.layout.templateId}
          onChange={(e) => setTemplate(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <BackupMenu />
      </div>

      <div className="flex items-center gap-3">
        {atsReport?.warnings?.length ? (
          <span
            className="cursor-help text-xs text-amber-600"
            title={atsReport.warnings.map((w) => w.message).join("\n")}
          >
            {atsReport.warnings.length} ATS warning
            {atsReport.warnings.length > 1 ? "s" : ""}
          </span>
        ) : null}
        {atsReport?.info?.length ? (
          <span
            className="cursor-help text-xs text-slate-400"
            title={atsReport.info.map((i) => i.message).join("\n")}
          >
            {atsReport.info.length} note{atsReport.info.length > 1 ? "s" : ""}
          </span>
        ) : null}
        {error ? <span className="text-xs text-red-500">{error}</span> : null}
        <Button onClick={handleDownload} disabled={busy || !backendUp}>
          {busy ? "Preparing..." : "Download PDF"}
        </Button>
      </div>
    </header>
  );
}

export default function App() {
  const view = useAppStore((s) => s.view);
  const setHealth = useAppStore((s) => s.setHealth);

  useEffect(() => {
    getHealth()
      .then((h) => setHealth({ backendUp: true, aiEnabled: h.aiEnabled }))
      .catch(() => setHealth({ backendUp: false, aiEnabled: false }));
  }, [setHealth]);

  if (view === "landing") return <Landing />;
  if (view === "gallery") return <TemplateGallery />;
  if (view === "import-review") return <ImportReview />;

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white">
          <JDInput />
          <FormPanel />
        </div>
        <div className="hidden min-h-0 lg:block">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}
