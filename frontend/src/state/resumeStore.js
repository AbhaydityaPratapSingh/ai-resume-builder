import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptyResume,
  emptyProjectForm,
  makeId,
  makeBullet,
  migrateResumeData,
  normalizeResumeData,
  SCHEMA_VERSION,
} from "@resume-maker/shared";

const STARTER = {
  experience: () => ({
    id: makeId(),
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    bullets: [makeBullet()],
  }),
  education: () => ({
    id: makeId(),
    level: "",
    institution: "",
    degree: "",
    branch: "",
    board: "",
    startDate: "",
    endDate: "",
    score: null,
  }),
  projects: () => ({
    id: makeId(),
    title: "",
    source: "form",
    link: "",
    startDate: "",
    endDate: "",
    techStack: [],
    form: emptyProjectForm(),
    bullets: [],
  }),
  achievements: () => ({ id: makeId(), text: "" }),
  responsibilities: () => ({
    id: makeId(),
    role: "",
    org: "",
    startDate: "",
    endDate: "",
    bullets: [makeBullet()],
  }),
  certifications: () => ({ id: makeId(), name: "", issuer: "", date: "" }),
};

function mapItem(state, section, id, fn) {
  return {
    resumeData: {
      ...state.resumeData,
      [section]: state.resumeData[section].map((item) =>
        item.id === id ? fn(item) : item
      ),
    },
  };
}

function mapBullet(state, section, id, bulletId, fn) {
  return mapItem(state, section, id, (item) => ({
    ...item,
    bullets: item.bullets.map((b) => (b.id === bulletId ? fn(b) : b)),
  }));
}

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

      setLinks: (links) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            personal: { ...s.resumeData.personal, links },
          },
        })),

      setSummary: (value) =>
        set((s) => ({ resumeData: { ...s.resumeData, summary: value } })),

      setSkillGroups: (skills) =>
        set((s) => ({ resumeData: { ...s.resumeData, skills } })),

      addSkillGroup: () =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            skills: [...s.resumeData.skills, { id: makeId(), group: "", items: [] }],
          },
        })),

      updateSkillGroup: (id, field, value) =>
        set((s) => mapItem(s, "skills", id, (g) => ({ ...g, [field]: value }))),

      removeSkillGroup: (id) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            skills: s.resumeData.skills.filter((g) => g.id !== id),
          },
        })),

      addItem: (section) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            [section]: [...s.resumeData[section], STARTER[section]()],
          },
        })),

      // Used by "Import from GitHub" — merges the fetched repo's fields
      // over a blank project so anything it didn't provide (Problem, Role,
      // Result — everything the student still has to answer by hand) comes
      // out as an ordinary empty field, not undefined.
      addProjectFromImport: ({ title, link, techStack, description }) =>
        set((s) => {
          const base = STARTER.projects();
          return {
            resumeData: {
              ...s.resumeData,
              projects: [
                ...s.resumeData.projects,
                {
                  ...base,
                  title,
                  link,
                  techStack,
                  source: "github",
                  form: { ...base.form, built: description || "" },
                },
              ],
            },
          };
        }),

      updateItem: (section, id, field, value) =>
        set((s) => mapItem(s, section, id, (item) => ({ ...item, [field]: value }))),

      removeItem: (section, id) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            [section]: s.resumeData[section].filter((item) => item.id !== id),
          },
        })),

      // A hand edit replaces the user's own words, so any suggestion made
      // against the previous text no longer applies.
      setBulletText: (section, id, bulletId, value) =>
        set((s) =>
          mapBullet(s, section, id, bulletId, (b) => ({
            ...b,
            original: value,
            suggestion: null,
            accepted: "original",
          }))
        ),

      setBulletSuggestion: (section, id, bulletId, suggestion) =>
        set((s) =>
          mapBullet(s, section, id, bulletId, (b) => ({ ...b, suggestion }))
        ),

      acceptBullet: (section, id, bulletId) =>
        set((s) =>
          mapBullet(s, section, id, bulletId, (b) => ({ ...b, accepted: "suggestion" }))
        ),

      revertBullet: (section, id, bulletId) =>
        set((s) =>
          mapBullet(s, section, id, bulletId, (b) => ({ ...b, accepted: "original" }))
        ),

      dismissSuggestion: (section, id, bulletId) =>
        set((s) =>
          mapBullet(s, section, id, bulletId, (b) => ({
            ...b,
            suggestion: null,
            accepted: "original",
          }))
        ),

      addBullet: (section, id) =>
        set((s) =>
          mapItem(s, section, id, (item) => ({
            ...item,
            bullets: [...item.bullets, makeBullet()],
          }))
        ),

      removeBullet: (section, id, bulletId) =>
        set((s) =>
          mapItem(s, section, id, (item) => ({
            ...item,
            bullets: item.bullets.filter((b) => b.id !== bulletId),
          }))
        ),

      // Appends generated draft bullets after whatever's already there,
      // skipping exact-text duplicates, so re-running "Generate bullets"
      // after editing the form never destroys a bullet the student already
      // hand-edited or removed a match from.
      appendBullets: (section, id, texts) =>
        set((s) =>
          mapItem(s, section, id, (item) => {
            const existing = new Set(item.bullets.map((b) => b.original));
            const additions = texts.filter((t) => !existing.has(t)).map((t) => makeBullet(t));
            return { ...item, bullets: [...item.bullets, ...additions] };
          })
        ),

      updateProjectForm: (id, field, value) =>
        set((s) => mapItem(s, "projects", id, (item) => ({ ...item, form: { ...item.form, [field]: value } }))),

      setTemplate: (templateId) =>
        set((s) => ({
          resumeData: {
            ...s.resumeData,
            layout: { ...s.resumeData.layout, templateId },
          },
        })),

      setTargetJD: (jd) =>
        set((s) => ({
          resumeData: { ...s.resumeData, meta: { ...s.resumeData.meta, targetJD: jd } },
        })),

      // Moves the given section keys to the front of layout.sectionOrder, in
      // the order given, keeping every other section's relative order after
      // them. Used to apply the analysis engine's suggested order.
      setSectionOrder: (leadingKeys) =>
        set((s) => {
          const current = s.resumeData.layout.sectionOrder;
          const rest = current.filter((k) => !leadingKeys.includes(k));
          return {
            resumeData: {
              ...s.resumeData,
              layout: { ...s.resumeData.layout, sectionOrder: [...leadingKeys, ...rest] },
            },
          };
        }),

      replaceResume: (resumeData) =>
        set({ resumeData: migrateResumeData(resumeData) }),

      reset: () => set({ resumeData: emptyResume() }),
    }),
    {
      name: "resume-builder-data",
      version: SCHEMA_VERSION,
      migrate: (persisted, fromVersion) => ({
        ...persisted,
        resumeData: migrateResumeData(persisted?.resumeData, fromVersion),
      }),
      // migrate only fires when the stored version differs, so anything saved
      // under the current version number is never repaired by it. merge runs
      // on every rehydrate, which is the only place a bad shape can be caught.
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        resumeData: normalizeResumeData(persisted?.resumeData) || emptyResume(),
      }),
    }
  )
);
