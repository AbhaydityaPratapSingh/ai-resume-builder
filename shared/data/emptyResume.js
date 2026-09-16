export function emptyResume() {
  return {
    personal: {
      name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    meta: {
      selectedTemplateId: "classic",
      targetJD: "",
      matchScore: null,
    },
  };
}

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}
