import assert from "node:assert/strict";
import test from "node:test";

import { cloneEmptyContent } from "../src/lib/content";
import { createCvPdf } from "../src/lib/pdf";

test("las dos plantillas de CV generan un PDF válido desde el mismo snapshot", async () => {
  const content = cloneEmptyContent();
  content.fullName = "Daniel Del Angel Aranda";
  content.career = "Ingeniería en Sistemas";
  content.summary = "Perfil de prueba para la generación del CV.";
  content.skills = [{ category: "Profesionales", items: ["Liderazgo", "Trabajo en equipo"] }];
  const [classic, modern] = await Promise.all([createCvPdf(content, "classic"), createCvPdf(content, "modern")]);
  assert.equal(Buffer.from(classic).subarray(0, 4).toString(), "%PDF");
  assert.equal(Buffer.from(modern).subarray(0, 4).toString(), "%PDF");
  assert.notDeepEqual(classic, modern);
});
