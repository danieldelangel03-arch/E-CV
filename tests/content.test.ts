import assert from "node:assert/strict";
import test from "node:test";

import { cloneEmptyContent } from "../src/lib/content";
import { assertPublishable, parseProfileContent, registerStudentSchema, slugSchema } from "../src/lib/validation";

test("el slug reservado admin no puede asignarse a un estudiante", () => {
  assert.equal(slugSchema.safeParse("admin").success, false);
  assert.equal(slugSchema.parse("Perfil-Daniel"), "perfil-daniel");
});

test("el auto-registro exige identidad, carrera, contraseña segura y slug permanente", () => {
  const valid = registerStudentSchema.safeParse({
    fullName: "Ana Torres",
    career: "Ingeniería de Software",
    email: "ana@example.edu",
    password: "UnaClave!Segura2026",
    slug: "ana-torres",
  });
  assert.equal(valid.success, true);
  if (!valid.success) throw new Error("El caso de registro válido fue rechazado.");
  assert.equal(registerStudentSchema.safeParse({ ...valid.data, slug: "Ana Torres" }).success, false);
  assert.equal(registerStudentSchema.safeParse({ ...valid.data, password: "corta" }).success, false);
});

test("la publicación exige nombre y carrera", () => {
  const content = cloneEmptyContent();
  assert.throws(() => assertPublishable(content), /nombre y carrera/);
  assert.doesNotThrow(() => assertPublishable({ ...content, fullName: "Daniel", career: "Ingeniería" }));
});

test("el validador elimina filas vacías sin cambiar el contenido publicado existente", () => {
  const parsed = parseProfileContent({
    ...cloneEmptyContent(),
    fullName: "Daniel",
    career: "Ingeniería",
    skills: [{ category: "", items: ["", "Liderazgo"] }],
    projects: [{ title: "", role: "", year: "", description: "", technologies: "", url: "", academic: true }],
  });
  assert.deepEqual(parsed.skills, [{ category: "", items: ["Liderazgo"] }]);
  assert.equal(parsed.projects.length, 0);
});
