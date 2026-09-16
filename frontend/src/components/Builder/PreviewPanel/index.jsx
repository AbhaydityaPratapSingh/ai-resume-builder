import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { renderResumeHTML } from "@resume-maker/shared";
import { useResumeStore } from "../../../state/resumeStore.js";

const PAGE_WIDTH = 800;
const PAGE_HEIGHT = 1131; // A4 ratio at 800px wide

export default function PreviewPanel() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 48;
      setScale(Math.min(1, available / PAGE_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [html, setHtml] = useState("");
  useEffect(() => {
    const id = setTimeout(
      () => setHtml(renderResumeHTML(resumeData, resumeData.meta.selectedTemplateId)),
      120
    );
    return () => clearTimeout(id);
  }, [resumeData]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-slate-200 p-6">
      <div
        style={{
          width: PAGE_WIDTH * scale,
          height: PAGE_HEIGHT * scale,
          margin: "0 auto",
        }}
      >
        <iframe
          title="Resume preview"
          srcDoc={html}
          sandbox=""
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            border: "none",
            background: "white",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            boxShadow: "0 1px 12px rgba(15, 23, 42, 0.18)",
          }}
        />
      </div>
    </div>
  );
}
