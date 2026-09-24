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
  view: "gallery",
  aiEnabled: false,
  backendUp: false,
  keywordGap: null,
  matchScore: null,
  atsReport: null,
  // The resume + JD the analysis panels were computed from.
  analysisHash: null,

  setView: (view) => set({ view }),
  setHealth: ({ backendUp, aiEnabled }) => set({ backendUp, aiEnabled }),
  setAnalysis: ({ keywordGap, matchScore, analysisHash }) =>
    set({ keywordGap, matchScore, analysisHash }),
  clearAnalysis: () => set({ keywordGap: null, matchScore: null, analysisHash: null }),
  setAtsReport: (atsReport) => set({ atsReport }),
}));
