import { create } from "zustand";

// Cheap, stable content hash — only used to tell whether an analysis result
// still matches what is in the form.
export function hashResume(resumeData) {
  const str = JSON.stringify(resumeData);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

export const useAppStore = create((set) => ({
  view: "landing",
  aiEnabled: false,
  backendUp: false,
  // Result of the rule-based analysis engine (shared/text): score, matched
  // and missing skills, eligibility checks, suggested section order.
  analysis: null,
  atsReport: null,
  // The resume + JD the analysis result was computed from.
  analysisHash: null,
  // The best-effort draft from POST /api/import/pdf, shown on the import
  // review screen. Cleared once the user accepts or discards it.
  importDraft: null,

  setView: (view) => set({ view }),
  setHealth: ({ backendUp, aiEnabled }) => set({ backendUp, aiEnabled }),
  setAnalysis: ({ analysis, analysisHash }) => set({ analysis, analysisHash }),
  clearAnalysis: () => set({ analysis: null, analysisHash: null }),
  setAtsReport: (atsReport) => set({ atsReport }),
  setImportDraft: (importDraft) => set({ importDraft }),
}));
