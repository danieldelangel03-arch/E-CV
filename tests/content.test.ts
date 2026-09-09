import assert from "node:assert/strict";
import test from "node:test";

import { cloneEmptyContent } from "../src/lib/content";
import { assertPublishable, parseProfileContent, slugSchema } from "../src/lib/validation";

test("el slug reservado admin no puede asignarse a un estudiante", () => {
  assert.equal(slugSchema.safeParse("admin").success, false);
  assert.equal(slugSchema.parse("Perfil-Daniel"), "perfil-daniel");
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
