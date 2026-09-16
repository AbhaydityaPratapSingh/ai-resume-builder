import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyResume, makeId } from "@resume-maker/shared";

const STARTER = {
  experience: () => ({
    id: makeId(),
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    bullets: [""],
  }),
  education: () => ({
    id: makeId(),
    institution: "",
    degree: "",
    startDate: "",
    endDate: "",
    score: "",
  }),
  projects: () => ({
    id: makeId(),
    title: "",
    source: "manual",
    repoUrl: "",
    techStack: [],
    bullets: [""],
  }),
  certifications: () => ({ id: makeId(), name: "", issuer: "", date: "" }),
};

export const useResumeStore = create(
  persist(
    (set) => ({
      resumeData: emptyResume(),

      setPersonal: (field, value) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            personal: { ...s.resumeData.personal, [field]: value },
          },
        })),

      setSummary: (value) =>
        set((s) => ({ resumeData: { ...s.resumeData, summary: value } })),

      setSkills: (skills) =>
        set((s) => ({ resumeData: { ...s.resumeData, skills } })),

      addItem: (section) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            [section]: [...s.resumeData[section], STARTER[section]()],
          },
        })),

      updateItem: (section, id, field, value) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            [section]: s.resumeData[section].map((item) =>
              item.id === id ? { ...item, [field]: value } : item
            ),
          },
        })),

      removeItem: (section, id) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            [section]: s.resumeData[section].filter((item) => item.id !== id),
          },
        })),

      setBullet: (section, id, index, value) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            [section]: s.resumeData[section].map((item) =>
              item.id === id
                ? {
                    ...item,
                    bullets: item.bullets.map((b, i) => (i === index ? value : b)),
                  }
                : item
            ),
          },
        })),

      addBullet: (section, id) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            [section]: s.resumeData[section].map((item) =>
              item.id === id ? { ...item, bullets: [...item.bullets, ""] } : item
            ),
          },
        })),

      removeBullet: (section, id, index) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            [section]: s.resumeData[section].map((item) =>
              item.id === id
                ? { ...item, bullets: item.bullets.filter((_, i) => i !== index) }
                : item
            ),
          },
        })),

      setTemplate: (templateId) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            meta: { ...s.resumeData.meta, selectedTemplateId: templateId },
          },
        })),

      setTargetJD: (jd) =>
        set((s) => ({
          resumeData: { ...s.resumeData, meta: { ...s.resumeData.meta, targetJD: jd } },
        })),

      setMatchScore: (matchScore) =>
        set((s) => ({
          resumeData: { ...s.resumeData, meta: { ...s.resumeData.meta, matchScore } },
        })),

      reset: () => set({ resumeData: emptyResume() }),
    }),
    { name: "resume-builder-data" }
  )
);
