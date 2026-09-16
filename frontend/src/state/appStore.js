import { create } from "zustand";

export const useAppStore = create((set) => ({
  view: "gallery",
  aiEnabled: false,
  backendUp: false,
  keywordGap: null,
  matchScore: null,
  atsReport: null,

  setView: (view) => set({ view }),
  setHealth: ({ backendUp, aiEnabled }) => set({ backendUp, aiEnabled }),
  setKeywordGap: (keywordGap) => set({ keywordGap }),
  setMatchScore: (matchScore) => set({ matchScore }),
  setAtsReport: (atsReport) => set({ atsReport }),
}));
