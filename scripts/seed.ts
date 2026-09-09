import { createHash, randomUUID } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { z } from "zod";

import type { ProfileContent } from "../src/lib/content";
import {
  profileCurrent,
  profiles,
  profileVersions,
  users,
} from "../src/lib/db/schema";
import { parseProfileContent, passwordSchema } from "../src/lib/validation";

loadEnvConfig(process.cwd(), true);

const DANIEL_EMAIL = "daniel.delangel03@iest.edu.mx";
const DANIEL_SLUG = "daniel-del-angel";

const emailSchema = z.string().trim().email().max(320).transform((value) => value.toLowerCase());

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}.`);
  }
  return value;
}

function contentHash(content: ProfileContent): string {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

function danielContent(): ProfileContent {
  return parseProfileContent({
    fullName: "Daniel Del Angel Aranda",
    career: "Ingeniería en Sistemas y Negocios Digitales, 6.º semestre",
    summary:
      "Estudiante comprometido y con pasión por su profesión. Con buen trato humano, organización y trabajo en equipo. Versátil, adaptable y proactivo, capaz de desarrollarme en infraestructura, software y mejora de procesos, siempre con enfoque en resultados.",
    avatarAssetId: null,
    contact: {
      email: DANIEL_EMAIL,
      phone: "833 150 0200",
      location: "",
    },
    education: [
      {
        institution: "Universidad IEST Anáhuac",
        program: "Ingeniería en Sistemas y Negocios Digitales",
        period: "2023 a la actualidad",
      },
      {
        institution: "CETIS 109",
        program: "Técnico en Electrónica",
        period: "2020 a 2023",
      },
    ],
    courses: [
      {
        title: "Diplomado en Competencias Profesionales y Habilidades de Liderazgo",
        status: "En curso",
      },
      { title: "Certificado en Competencias Digitales", status: "" },
      { title: "Certificado en Microsoft", status: "" },
      { title: "Cisco", status: "" },
      { title: "W3School", status: "" },
    ],
    languages: ["Inglés B2"],
    skills: [
      {
        category: "Habilidades",
        items: [
          "Liderazgo",
          "Trabajo en equipo",
          "Coordinación de eventos",
          "Manejo de plataformas digitales",
          "Facilidad de palabra y exposición",
          "Resolución de conflictos",
          "Escucha activa",
          "Desarrollo de mejoras",
        ],
      },
    ],
    experience: [
      {
        title: "Miembro del Comité de Investigación",
        organization: "",
        period: "2024-2025",
        description: "",
      },
      {
        title: "Postulación a Manager",
        organization: "",
        period: "2024-2025",
        description: "",
      },
      {
        title: "Miembro del Comité de Imagen y RP",
        organization: "",
        period: "2024-2025",
        description: "",
      },
      {
        title: "Staff en Seminario Intermedio",
        organization: "",
        period: "2026",
        description: "",
      },
      {
        title: "Miembro del Comité de Integración",
        organization: "",
        period: "2024-2025",
        description: "",
      },
      {
        title: "Congreso Nacional Anáhuac Cancún",
        organization: "",
        period: "2025",
        description: "",
      },
      {
        title: "Líder de equipo en Posada",
        organization: "",
        period: "2025",
        description: "",
      },
      {
        title: "Staff en seminario generacional",
        organization: "",
        period: "",
        description: "",
      },
      {
        title: "Líder de equipo y staff en Seminario",
        organization: "",
        period: "2026",
        description: "",
      },
      {
        title: "Voluntariados con ASI, FESAL y campañas de donación de alimentos y sangre",
        organization: "",
        period: "",
        description: "",
      },
    ],
    projects: [
      {
        title: "Proyecto estudiantil de un reactor",
        role: "Líder de área de aprendizaje y desarrollo con nuevas tecnologías",
        year: "2025",
        description: "",
        technologies: "",
        url: "",
        academic: true,
      },
      {
        title: "Sistema de ciberseguridad",
        role: "Miembro de equipo de aprendizaje y desarrollo con nuevas tecnologías",
        year: "2025",
        description: "",
        technologies: "",
        url: "",
        academic: true,
      },
      {
        title: "LiveSpace",
        role: "Líder de equipo en emprendimiento educativo",
        year: "2025",
        description: "",
        technologies: "",
        url: "",
        academic: true,
      },
    ],
    achievements: [],
    links: [],
    pdfTemplate: "classic",
  });
}

async function seed() {
  const databaseUrl = requiredEnvironment("DATABASE_URL");
  const adminEmail = emailSchema.parse(requiredEnvironment("SEED_ADMIN_EMAIL"));
  const adminPassword = passwordSchema.parse(requiredEnvironment("SEED_ADMIN_PASSWORD"));
  const studentPassword = passwordSchema.parse(requiredEnvironment("SEED_STUDENT_PASSWORD"));

  if (adminEmail === DANIEL_EMAIL) {
    throw new Error("SEED_ADMIN_EMAIL no puede ser el correo del estudiante inicial.");
  }

  const db = drizzle(neon(databaseUrl), {
    schema: { users, profiles, profileVersions, profileCurrent },
  });
  const created: string[] = [];
  const preserved: string[] = [];

  await db.transaction(async (tx) => {
    const [existingAdmin] = await tx
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin && existingAdmin.role !== "admin") {
      throw new Error(`La cuenta ${adminEmail} ya existe y no tiene rol de administrador.`);
    }

    if (!existingAdmin) {
      await tx.insert(users).values({
        id: randomUUID(),
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "admin",
        isActive: true,
      });
      created.push("administrador");
    } else {
      preserved.push("administrador");
    }

    const [existingDaniel] = await tx
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, DANIEL_EMAIL))
      .limit(1);

    if (existingDaniel && existingDaniel.role !== "student") {
      throw new Error(`La cuenta ${DANIEL_EMAIL} ya existe y no tiene rol de estudiante.`);
    }

    const danielUserId = existingDaniel?.id ?? randomUUID();
    if (!existingDaniel) {
      await tx.insert(users).values({
        id: danielUserId,
        email: DANIEL_EMAIL,
        passwordHash: await bcrypt.hash(studentPassword, 12),
        role: "student",
        isActive: true,
      });
      created.push("estudiante Daniel");
    } else {
      preserved.push("estudiante Daniel");
    }

    const [profileForDaniel] = await tx
      .select({ id: profiles.id, userId: profiles.userId, slug: profiles.slug })
      .from(profiles)
      .where(eq(profiles.userId, danielUserId))
      .limit(1);
    const [profileForSlug] = await tx
      .select({ id: profiles.id, userId: profiles.userId, slug: profiles.slug })
      .from(profiles)
      .where(eq(profiles.slug, DANIEL_SLUG))
      .limit(1);

    if (profileForDaniel && profileForDaniel.slug !== DANIEL_SLUG) {
      throw new Error(`El estudiante inicial ya tiene el slug ${profileForDaniel.slug}.`);
    }
    if (profileForSlug && profileForSlug.userId !== danielUserId) {
      throw new Error(`El slug ${DANIEL_SLUG} ya pertenece a otra cuenta.`);
    }

    const profileId = profileForDaniel?.id ?? profileForSlug?.id ?? randomUUID();
    if (!profileForDaniel && !profileForSlug) {
      await tx.insert(profiles).values({ id: profileId, userId: danielUserId, slug: DANIEL_SLUG });
      created.push("perfil de Daniel");
    } else {
      preserved.push("perfil de Daniel");
    }

    const [current] = await tx
      .select({
        draftVersionId: profileCurrent.draftVersionId,
        publishedVersionId: profileCurrent.publishedVersionId,
      })
      .from(profileCurrent)
      .where(eq(profileCurrent.profileId, profileId))
      .limit(1);

    if (current?.draftVersionId || current?.publishedVersionId) {
      preserved.push("snapshots de Daniel");
      return;
    }

    const [latestVersion] = await tx
      .select({ sequence: profileVersions.sequence })
      .from(profileVersions)
      .where(eq(profileVersions.profileId, profileId))
      .orderBy(desc(profileVersions.sequence))
      .limit(1);

    const publishedVersionId = randomUUID();
    const draftVersionId = randomUUID();
    const publishedContent = danielContent();
    const draftContent = danielContent();
    const publishedAt = new Date();
    const firstSequence = (latestVersion?.sequence ?? 0) + 1;

    await tx.insert(profileVersions).values([
      {
        id: publishedVersionId,
        profileId,
        sequence: firstSequence,
        kind: "published",
        content: publishedContent,
        contentHash: contentHash(publishedContent),
        sourceVersionId: null,
        createdBy: danielUserId,
        publishedAt,
      },
      {
        id: draftVersionId,
        profileId,
        sequence: firstSequence + 1,
        kind: "draft",
        content: draftContent,
        contentHash: contentHash(draftContent),
        sourceVersionId: publishedVersionId,
        createdBy: danielUserId,
        publishedAt: null,
      },
    ]);

    if (current) {
      await tx
        .update(profileCurrent)
        .set({ draftVersionId, publishedVersionId, updatedAt: new Date() })
        .where(eq(profileCurrent.profileId, profileId));
    } else {
      await tx.insert(profileCurrent).values({
        profileId,
        draftVersionId,
        publishedVersionId,
      });
    }
    created.push("snapshots publicado y borrador de Daniel");
  });

  console.log(
    `Seed completado. Creados: ${created.length ? created.join(", ") : "ninguno"}. ` +
      `Conservados: ${preserved.length ? preserved.join(", ") : "ninguno"}.`,
  );
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Error desconocido durante el seed.";
  console.error(`No se pudo ejecutar el seed: ${message}`);
  process.exitCode = 1;
});
