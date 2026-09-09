import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import type { PdfTemplate, ProfileContent } from "@/lib/content";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;

const navy = rgb(0.035, 0.12, 0.23);
const teal = rgb(0.02, 0.55, 0.58);
const yellow = rgb(0.95, 0.71, 0.16);
const ink = rgb(0.09, 0.16, 0.23);
const muted = rgb(0.31, 0.39, 0.46);

function printable(value: string) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\xFF\n]/g, "");
}

function wrap(value: string, font: PDFFont, size: number, width: number) {
  const words = printable(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class CvCanvas {
  private page: PDFPage;
  private y = 0;

  constructor(
    private readonly document: PDFDocument,
    private readonly regular: PDFFont,
    private readonly bold: PDFFont,
    private readonly template: PdfTemplate,
    private readonly content: ProfileContent,
  ) {
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.drawHeader();
  }

  private drawHeader() {
    const isModern = this.template === "modern";
    this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 152, width: PAGE_WIDTH, height: 152, color: navy });
    if (isModern) {
      this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 152, width: 15, height: 152, color: yellow });
      this.page.drawCircle({ x: PAGE_WIDTH - 54, y: PAGE_HEIGHT - 58, size: 28, color: teal, opacity: 0.85 });
    } else {
      this.page.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - 133, width: 86, height: 5, color: yellow });
    }
    this.page.drawText(printable(this.content.fullName || "EProfile"), {
      x: MARGIN,
      y: PAGE_HEIGHT - 70,
      size: 24,
      font: this.bold,
      color: rgb(1, 1, 1),
    });
    this.page.drawText(printable(this.content.career), {
      x: MARGIN,
      y: PAGE_HEIGHT - 96,
      size: 10.5,
      font: this.regular,
      color: rgb(0.86, 0.94, 0.95),
      maxWidth: PAGE_WIDTH - 2 * MARGIN - 25,
    });
    const details = [this.content.contact.email, this.content.contact.phone, this.content.contact.location]
      .filter(Boolean)
      .join("  |  ");
    if (details) {
      this.page.drawText(printable(details), {
        x: MARGIN,
        y: PAGE_HEIGHT - 122,
        size: 8.5,
        font: this.regular,
        color: rgb(0.72, 0.84, 0.87),
        maxWidth: PAGE_WIDTH - 2 * MARGIN,
      });
    }
    this.y = PAGE_HEIGHT - 181;
  }

  private newPage() {
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.drawHeader();
  }

  private ensure(required: number) {
    if (this.y - required < MARGIN) this.newPage();
  }

  section(title: string) {
    this.ensure(31);
    this.page.drawRectangle({ x: MARGIN, y: this.y - 2, width: 28, height: 3, color: teal });
    this.page.drawText(printable(title.toUpperCase()), {
      x: MARGIN + 36,
      y: this.y - 7,
      size: 10,
      font: this.bold,
      color: navy,
    });
    this.y -= 26;
  }

  paragraph(value: string, size = 9.5, color = ink) {
    const lines = wrap(value, this.regular, size, PAGE_WIDTH - MARGIN * 2);
    for (const line of lines) {
      this.ensure(size + 7);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.regular, color });
      this.y -= size + 4;
    }
    this.y -= 4;
  }

  entry(title: string, meta: string, description?: string) {
    this.ensure(32);
    const titleLines = wrap(title, this.bold, 9.5, PAGE_WIDTH - MARGIN * 2);
    titleLines.forEach((line) => {
      this.ensure(15);
      this.page.drawText(line, { x: MARGIN, y: this.y, size: 9.5, font: this.bold, color: ink });
      this.y -= 13;
    });
    if (meta) {
      this.paragraph(meta, 8.5, muted);
      this.y += 4;
    }
    if (description) this.paragraph(description, 8.8, ink);
    this.y -= 2;
  }

  bullets(values: string[]) {
    for (const value of values.filter(Boolean)) {
      const lines = wrap(value, this.regular, 9, PAGE_WIDTH - MARGIN * 2 - 14);
      lines.forEach((line, index) => {
        this.ensure(15);
        if (index === 0) this.page.drawCircle({ x: MARGIN + 3, y: this.y + 3, size: 1.7, color: teal });
        this.page.drawText(line, { x: MARGIN + 12, y: this.y, size: 9, font: this.regular, color: ink });
        this.y -= 13;
      });
    }
    this.y -= 4;
  }
}

export async function createCvPdf(content: ProfileContent, template: PdfTemplate) {
  const document = await PDFDocument.create();
  document.setTitle(`${content.fullName || "EProfile"} - CV`);
  document.setAuthor("EProfile");
  document.setSubject("Curriculum vitae generado desde el perfil publicado");
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const canvas = new CvCanvas(document, regular, bold, template, content);

  if (content.summary) {
    canvas.section("Perfil profesional");
    canvas.paragraph(content.summary);
  }
  if (content.education.length) {
    canvas.section("Formación");
    content.education.forEach((item) => canvas.entry(item.institution, [item.program, item.period].filter(Boolean).join(" - ")));
  }
  if (content.experience.length) {
    canvas.section("Experiencia y participación");
    content.experience.forEach((item) =>
      canvas.entry(item.title, [item.organization, item.period].filter(Boolean).join(" - "), item.description),
    );
  }
  if (content.projects.length) {
    canvas.section("Proyectos");
    content.projects.forEach((item) => {
      const meta = [item.academic ? "Proyecto académico" : "Proyecto", item.role, item.year, item.technologies]
        .filter(Boolean)
        .join(" - ");
      canvas.entry(item.title, meta, item.description);
    });
  }
  if (content.skills.length) {
    canvas.section("Habilidades");
    content.skills.forEach((group) => canvas.entry(group.category, "", group.items.join(" · ")));
  }
  if (content.courses.length) {
    canvas.section("Cursos y certificaciones");
    canvas.bullets(content.courses.map((item) => [item.title, item.status].filter(Boolean).join(" - ")));
  }
  if (content.languages.length) {
    canvas.section("Idiomas");
    canvas.bullets(content.languages);
  }
  if (content.achievements.length) {
    canvas.section("Reconocimientos");
    content.achievements.forEach((item) =>
      canvas.entry(item.title, [item.issuer, item.year].filter(Boolean).join(" - "), item.description),
    );
  }

  return document.save();
}
