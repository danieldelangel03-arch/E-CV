import assert from "node:assert/strict";
import test from "node:test";

import { cloneEmptyContent } from "../src/lib/content";
import { buildVCard } from "../src/lib/vcard";

test("la vCard usa datos publicados y escapa caracteres especiales", () => {
  const content = cloneEmptyContent();
  content.fullName = "Daniel Del Angel";
  content.career = "Sistemas";
  content.contact.email = "daniel@example.edu";
  content.contact.phone = "833 150 0200";
  content.contact.location = "Tampico, Tamaulipas";
  const vcard = buildVCard(content, "https://eprofile.example/daniel");
  assert.match(vcard, /BEGIN:VCARD\r\nVERSION:3.0/);
  assert.match(vcard, /ADR;TYPE=HOME:;;;Tampico\\, Tamaulipas/);
  assert.match(vcard, /URL:https:\/\/eprofile.example\/daniel/);
});
