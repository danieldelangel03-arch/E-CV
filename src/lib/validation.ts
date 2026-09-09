import { z } from "zod";

import type { ProfileContent } from "@/lib/content";

const shortText = (max: number) => z.string().trim().max(max).catch("");
const longText = (max: number) => z.string().trim().max(max).catch("");
const optionalUrl = z
  .string()
  .trim()
  .max(2_048)
  .refine((value) => !value || /^https?:\/\//i.test(value), "Usa una URL http(s) válida.")
  .catch("");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El slug debe tener al menos 3 caracteres.")
  .max(80, "El slug es demasiado largo.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones simples.")
  .refine((slug) => slug !== "admin", "El slug admin está reservado.");

export const passwordSchema = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres.")
  .max(200, "La contraseña es demasiado larga.");

export const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo válido.").max(320),
  password: z.string().min(1, "Ingresa tu contraseña.").max(200),
  next: z.string().optional(),
});

const educationSchema = z.object({
  institution: shortText(180),
  program: shortText(180),
  period: shortText(80),
});

const courseSchema = z.object({
  title: shortText(180),
  status: shortText(100),
});

const skillGroupSchema = z.object({
  category: shortText(80),
  items: z.array(shortText(80)).max(30).catch([]),
});

const experienceSchema = z.object({
  title: shortText(160),
  organization: shortText(160),
  period: shortText(80),
  description: longText(1_200),
});

const projectSchema = z.object({
  title: shortText(160),
  role: shortText(160),
  year: shortText(40),
  description: longText(1_500),
  technologies: shortText(300),
  url: optionalUrl,
  academic: z.boolean().catch(true),
});

const achievementSchema = z.object({
  title: shortText(180),
  issuer: shortText(160),
  year: shortText(40),
  description: longText(800),
});

const linkSchema = z.object({
  label: shortText(80),
  url: optionalUrl,
});

export const profileContentSchema = z.object({
  fullName: shortText(120),
  career: shortText(180),
  summary: longText(2_000),
  avatarAssetId: z.string().uuid().nullable().catch(null),
  contact: z
    .object({
      email: z
        .string()
        .trim()
        .max(320)
        .refine((value) => !value || z.string().email().safeParse(value).success, "Correo inválido.")
        .catch(""),
      phone: shortText(50),
      location: shortText(140),
    })
    .catch({ email: "", phone: "", location: "" }),
  education: z.array(educationSchema).max(30).catch([]),
  courses: z.array(courseSchema).max(40).catch([]),
  languages: z.array(shortText(80)).max(20).catch([]),
  skills: z.array(skillGroupSchema).max(20).catch([]),
  experience: z.array(experienceSchema).max(40).catch([]),
  projects: z.array(projectSchema).max(40).catch([]),
  achievements: z.array(achievementSchema).max(40).catch([]),
  links: z.array(linkSchema).max(20).catch([]),
  pdfTemplate: z.enum(["classic", "modern"]).catch("classic"),
});

export function parseProfileContent(value: unknown): ProfileContent {
  const parsed = profileContentSchema.parse(value);

  return {
    ...parsed,
    languages: parsed.languages.filter(Boolean),
    skills: parsed.skills
      .map((group) => ({ ...group, items: group.items.filter(Boolean) }))
      .filter((group) => group.category || group.items.length),
    education: parsed.education.filter((item) => item.institution || item.program || item.period),
    courses: parsed.courses.filter((item) => item.title || item.status),
    experience: parsed.experience.filter(
      (item) => item.title || item.organization || item.period || item.description,
    ),
    projects: parsed.projects.filter(
      (item) => item.title || item.role || item.year || item.description || item.technologies || item.url,
    ),
    achievements: parsed.achievements.filter(
      (item) => item.title || item.issuer || item.year || item.description,
    ),
    links: parsed.links.filter((item) => item.label || item.url),
  };
}

export function parseProfileContentJson(raw: FormDataEntryValue | null): ProfileContent {
  if (typeof raw !== "string" || raw.length > 100_000) {
    throw new Error("El contenido del perfil no es válido.");
  }

  try {
    return parseProfileContent(JSON.parse(raw));
  } catch {
    throw new Error("El contenido del perfil no es válido.");
  }
}

export function assertPublishable(content: ProfileContent) {
  if (!content.fullName || !content.career) {
    throw new Error("Para publicar se requieren nombre y carrera.");
  }
}

export const createStudentSchema = z.object({
  email: z.string().trim().email("Ingresa un correo válido.").max(320),
  password: passwordSchema,
  slug: slugSchema,
});

export const accountIdSchema = z.string().uuid("Cuenta no válida.");

export const registerStudentSchema = createStudentSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  career: z.string().trim().min(2).max(180),
});

export function isSafeRelativePath(value: string | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}
