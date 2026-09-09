export type PdfTemplate = "classic" | "modern";

export type Education = {
  institution: string;
  program: string;
  period: string;
};

export type Course = {
  title: string;
  status: string;
};

export type SkillGroup = {
  category: string;
  items: string[];
};

export type Experience = {
  title: string;
  organization: string;
  period: string;
  description: string;
};

export type Project = {
  title: string;
  role: string;
  year: string;
  description: string;
  technologies: string;
  url: string;
  academic: boolean;
};

export type Achievement = {
  title: string;
  issuer: string;
  year: string;
  description: string;
};

export type ProfileLink = {
  label: string;
  url: string;
};

export type ProfileContent = {
  fullName: string;
  career: string;
  summary: string;
  avatarAssetId: string | null;
  contact: {
    email: string;
    phone: string;
    location: string;
  };
  education: Education[];
  courses: Course[];
  languages: string[];
  skills: SkillGroup[];
  experience: Experience[];
  projects: Project[];
  achievements: Achievement[];
  links: ProfileLink[];
  pdfTemplate: PdfTemplate;
};

export const emptyProfileContent: ProfileContent = {
  fullName: "",
  career: "",
  summary: "",
  avatarAssetId: null,
  contact: {
    email: "",
    phone: "",
    location: "",
  },
  education: [],
  courses: [],
  languages: [],
  skills: [],
  experience: [],
  projects: [],
  achievements: [],
  links: [],
  pdfTemplate: "classic",
};

export function cloneEmptyContent(): ProfileContent {
  return structuredClone(emptyProfileContent);
}

export function hasMeaningfulContent(content: ProfileContent): boolean {
  return Boolean(
    content.fullName ||
      content.career ||
      content.summary ||
      content.education.length ||
      content.experience.length ||
      content.projects.length ||
      content.skills.some((group) => group.items.length),
  );
}

export function initials(fullName: string): string {
  const pieces = fullName.trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return "EP";
  return pieces
    .slice(0, 2)
    .map((piece) => piece[0]?.toUpperCase())
    .join("");
}

export function publicProfileStatus(input: {
  draftVersionId: string | null;
  publishedVersionId: string | null;
  draftContent?: ProfileContent | null;
}): "empty" | "draft" | "published" {
  if (input.publishedVersionId) return "published";
  if (input.draftVersionId && input.draftContent && hasMeaningfulContent(input.draftContent)) {
    return "draft";
  }
  return "empty";
}
