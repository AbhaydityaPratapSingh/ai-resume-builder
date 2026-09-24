import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { renderResumeHTML } from "@resume-maker/shared";
import { useResumeStore } from "../../../state/resumeStore.js";

// The page is defined in millimetres so the preview and the PDF share one
// geometry. 96 CSS px per inch, 25.4 mm per inch.
const MM_TO_PX = 96 / 25.4;
const PAGE_WIDTH_PX = Math.round(210 * MM_TO_PX);
const PAGE_HEIGHT_PX = Math.round(297 * MM_TO_PX);

export default function PreviewPanel() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(PAGE_HEIGHT_PX);
  const [html, setHtml] = useState("");

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 48;
      setScale(Math.min(1, available / PAGE_WIDTH_PX));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const id = setTimeout(
      () => setHtml(renderResumeHTML(resumeData, resumeData.layout.templateId)),
      120
    );
    return () => clearTimeout(id);
  }, [resumeData]);

  // Measure the rendered document so we know how many A4 pages it spans.
  function handleFrameLoad() {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const height = doc.documentElement?.scrollHeight || PAGE_HEIGHT_PX;
    setContentHeight(Math.max(height, PAGE_HEIGHT_PX));
  }

  const pageCount = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT_PX));
  const boundaries = Array.from({ length: pageCount - 1 }, (_, i) => i + 1);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-slate-200 p-6">
      <div
        className="relative mx-auto"
        style={{
          width: PAGE_WIDTH_PX * scale,
          height: contentHeight * scale,
        }}
      >
        <iframe
          ref={frameRef}
          title="Resume preview"
          srcDoc={html}
          sandbox=""
          onLoad={handleFrameLoad}
          style={{
            width: PAGE_WIDTH_PX,
            height: contentHeight,
            border: "none",
            background: "white",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            boxShadow: "0 1px 12px rgba(15, 23, 42, 0.18)",
          }}
        />

        {boundaries.map((page) => (
          <div
            key={page}
            className="pointer-events-none absolute right-0 left-0 border-t-2 border-dashed border-red-400/70"
            style={{ top: page * PAGE_HEIGHT_PX * scale }}
          >
            <span className="absolute right-0 -top-5 rounded bg-red-400/90 px-1.5 py-0.5 text-[10px] text-white">
              Page {page + 1} starts here
            </span>
          </div>
        ))}
      </div>

      {pageCount > 1 ? (
        <p className="mx-auto mt-3 text-center text-xs text-slate-500">
          {pageCount} pages — most campus placements expect a fresher resume to fit on
          one.
        </p>
      ) : null}
    </div>
  );
}
