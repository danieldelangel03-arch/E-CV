import type { ProfileContent } from "@/lib/content";

function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

export function buildVCard(content: ProfileContent, profileUrl: string) {
  const nameParts = content.fullName.trim().split(/\s+/);
  const familyName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
  const givenName = nameParts[0] ?? "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCard(familyName)};${escapeVCard(givenName)};;;`,
    `FN:${escapeVCard(content.fullName)}`,
    content.career ? `TITLE:${escapeVCard(content.career)}` : "",
    content.contact.email ? `EMAIL;TYPE=INTERNET:${escapeVCard(content.contact.email)}` : "",
    content.contact.phone ? `TEL;TYPE=CELL:${escapeVCard(content.contact.phone)}` : "",
    content.contact.location ? `ADR;TYPE=HOME:;;;${escapeVCard(content.contact.location)};;;;` : "",
    `URL:${escapeVCard(profileUrl)}`,
    "END:VCARD",
  ].filter(Boolean);

  return `${lines.join("\r\n")}\r\n`;
}
