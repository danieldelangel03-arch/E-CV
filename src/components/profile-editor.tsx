"use client";

import { CheckCircle2, Eye, FileUp, ImagePlus, Plus, Save, Send, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import type {
  Achievement,
  Course,
  Education,
  Experience,
  ProfileContent,
  ProfileLink,
  Project,
  SkillGroup,
} from "@/lib/content";

type ProfileAction = (formData: FormData) => Promise<void>;

type ProfileEditorProps = {
  initialContent: ProfileContent;
  saveAction: ProfileAction;
  publishAction: ProfileAction;
  previewHref: string;
  avatarUrl?: string | null;
  canPublish: boolean;
};

const blankEducation = (): Education => ({ institution: "", program: "", period: "" });
const blankCourse = (): Course => ({ title: "", status: "" });
const blankExperience = (): Experience => ({ title: "", organization: "", period: "", description: "" });
const blankProject = (): Project => ({
  title: "",
  role: "",
  year: "",
  description: "",
  technologies: "",
  url: "",
  academic: true,
});
const blankAchievement = (): Achievement => ({ title: "", issuer: "", year: "", description: "" });
const blankLink = (): ProfileLink => ({ label: "", url: "" });
const blankSkillGroup = (): SkillGroup => ({ category: "", items: [] });

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function ArrayHeader({ title, description, onAdd }: { title: string; description: string; onAdd: () => void }) {
  return <div className="array-header"><div><h3>{title}</h3><p>{description}</p></div><button type="button" className="button button--secondary button--small" onClick={onAdd}><Plus size={15} /> Añadir</button></div>;
}

function RemoveButton({ onClick, label = "Eliminar fila" }: { onClick: () => void; label?: string }) {
  return <button type="button" className="remove-button" onClick={onClick} aria-label={label}><Trash2 size={16} /></button>;
}

export function ProfileEditor({
  initialContent,
  saveAction,
  publishAction,
  previewHref,
  avatarUrl,
  canPublish,
}: ProfileEditorProps) {
  const [content, setContent] = useState<ProfileContent>(() => structuredClone(initialContent));
  const [pendingAction, setPendingAction] = useState<"save" | "publish" | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function runProfileAction(action: ProfileAction, kind: "save" | "publish") {
    const form = formRef.current;
    if (!form) return;
    setPendingAction(kind);
    setFeedback(null);
    try {
      await action(new FormData(form));
      setFeedback({ tone: "success", message: kind === "publish" ? "Perfil publicado. Tu E-CV pública ya muestra esta versión." : "Borrador guardado correctamente. Aún no es visible al público." });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "No se pudo completar la acción. Inténtalo de nuevo." });
    } finally {
      setPendingAction(null);
    }
  }

  function saveFromSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runProfileAction(saveAction, "save");
  }

  function setEducation(index: number, field: keyof Education, value: string) {
    setContent((previous) => ({
      ...previous,
      education: previous.education.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }
  function setCourse(index: number, field: keyof Course, value: string) {
    setContent((previous) => ({
      ...previous,
      courses: previous.courses.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }
  function setExperience(index: number, field: keyof Experience, value: string) {
    setContent((previous) => ({
      ...previous,
      experience: previous.experience.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }
  function setProject(index: number, field: keyof Project, value: string | boolean) {
    setContent((previous) => ({
      ...previous,
      projects: previous.projects.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } as Project : item),
    }));
  }
  function setAchievement(index: number, field: keyof Achievement, value: string) {
    setContent((previous) => ({
      ...previous,
      achievements: previous.achievements.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }
  function setLink(index: number, field: keyof ProfileLink, value: string) {
    setContent((previous) => ({
      ...previous,
      links: previous.links.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }
  function setSkillGroup(index: number, patch: Partial<SkillGroup>) {
    setContent((previous) => ({
      ...previous,
      skills: previous.skills.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  return (
    <form ref={formRef} className="profile-editor" onSubmit={saveFromSubmit} encType="multipart/form-data">
      <input type="hidden" name="content" value={JSON.stringify(content)} />
      <div className="editor-toolbar">
        <div><p className="eyebrow">Contenido privado</p><h1>Edita tu E-CV</h1><p>Guarda los cambios como borrador. Solo la publicación modifica tu página pública.</p></div>
        <div className="editor-toolbar__actions">
          <a className="button button--secondary" href={previewHref}><Eye size={16} /> Previsualizar</a>
          <button type="submit" className="button button--secondary" disabled={pendingAction !== null}><Save size={16} /> {pendingAction === "save" ? "Guardando…" : "Guardar borrador"}</button>
          <button type="button" onClick={() => void runProfileAction(publishAction, "publish")} className="button button--primary" disabled={!canPublish || pendingAction !== null}><Send size={16} /> {pendingAction === "publish" ? "Publicando…" : "Publicar"}</button>
        </div>
      </div>
      {!canPublish && <p className="editor-notice">Para publicar, completa como mínimo tu nombre y carrera.</p>}
      {feedback && <p className={`action-notice action-notice--${feedback.tone}`} role="status"><CheckCircle2 size={16} /> {feedback.message}</p>}

      <section className="editor-section">
        <div className="editor-section__heading"><span>01</span><div><p className="eyebrow">Identidad</p><h2>Información principal</h2></div></div>
        <div className="form-grid form-grid--two">
          <Field label="Nombre completo"><input value={content.fullName} onChange={(event) => setContent((previous) => ({ ...previous, fullName: event.target.value }))} placeholder="Tu nombre profesional" required /></Field>
          <Field label="Carrera o puesto"><input value={content.career} onChange={(event) => setContent((previous) => ({ ...previous, career: event.target.value }))} placeholder="Ej. Ingeniería en…" required /></Field>
          <Field label="Reseña profesional"><textarea value={content.summary} onChange={(event) => setContent((previous) => ({ ...previous, summary: event.target.value }))} rows={5} placeholder="Una descripción honesta de tu perfil, fortalezas y enfoque." /></Field>
          <div className="avatar-editor">
            <div className="avatar-editor__preview">
              {avatarUrl && content.avatarAssetId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Vista previa de la foto actual" width={84} height={84} />
              ) : <span>{content.fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase() || "EP"}</span>}
            </div>
            <div><p className="field-label">Fotografía de perfil</p><p className="field-help">JPG, PNG o WebP, máximo 2 MB. Se guarda en Neon y no se muestra hasta publicar.</p><label className="upload-control"><ImagePlus size={16} /> Cambiar foto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>{content.avatarAssetId && <label className="checkbox-field"><input name="removeAvatar" type="checkbox" /> Quitar foto al guardar</label>}</div>
          </div>
        </div>
      </section>

      <section className="editor-section">
        <div className="editor-section__heading"><span>02</span><div><p className="eyebrow">Contacto</p><h2>Datos y visibilidad</h2></div></div>
        <div className="form-grid form-grid--three">
          <Field label="Correo"><input type="email" value={content.contact.email} onChange={(event) => setContent((previous) => ({ ...previous, contact: { ...previous.contact, email: event.target.value } }))} placeholder="correo@ejemplo.com" /></Field>
          <Field label="Teléfono"><input value={content.contact.phone} onChange={(event) => setContent((previous) => ({ ...previous, contact: { ...previous.contact, phone: event.target.value } }))} placeholder="Número de contacto" /></Field>
          <Field label="Ciudad o ubicación"><input value={content.contact.location} onChange={(event) => setContent((previous) => ({ ...previous, contact: { ...previous.contact, location: event.target.value } }))} placeholder="Opcional" /></Field>
        </div>
      </section>

      <section className="editor-section">
        <div className="editor-section__heading"><span>03</span><div><p className="eyebrow">Trayectoria</p><h2>Educación y experiencia</h2></div></div>
        <div className="editor-array">
          <ArrayHeader title="Formación" description="Instituciones, programas y periodos relevantes." onAdd={() => setContent((previous) => ({ ...previous, education: [...previous.education, blankEducation()] }))} />
          {content.education.map((item, index) => <div className="array-row array-row--three" key={`education-${index}`}><Field label="Institución"><input value={item.institution} onChange={(event) => setEducation(index, "institution", event.target.value)} /></Field><Field label="Programa"><input value={item.program} onChange={(event) => setEducation(index, "program", event.target.value)} /></Field><Field label="Periodo"><input value={item.period} onChange={(event) => setEducation(index, "period", event.target.value)} /></Field><RemoveButton onClick={() => setContent((previous) => ({ ...previous, education: previous.education.filter((_, row) => row !== index) }))} /></div>)}
        </div>
        <div className="editor-array">
          <ArrayHeader title="Experiencia y participación" description="Usa títulos y contribuciones veraces; agrega contexto donde aporte valor." onAdd={() => setContent((previous) => ({ ...previous, experience: [...previous.experience, blankExperience()] }))} />
          {content.experience.map((item, index) => <div className="array-card" key={`experience-${index}`}><RemoveButton onClick={() => setContent((previous) => ({ ...previous, experience: previous.experience.filter((_, row) => row !== index) }))} /><div className="form-grid form-grid--three"><Field label="Título o rol"><input value={item.title} onChange={(event) => setExperience(index, "title", event.target.value)} /></Field><Field label="Organización"><input value={item.organization} onChange={(event) => setExperience(index, "organization", event.target.value)} /></Field><Field label="Periodo"><input value={item.period} onChange={(event) => setExperience(index, "period", event.target.value)} /></Field></div><Field label="Descripción"><textarea rows={3} value={item.description} onChange={(event) => setExperience(index, "description", event.target.value)} placeholder="Responsabilidades, aprendizaje o impacto verificable." /></Field></div>)}
        </div>
      </section>

      <section className="editor-section">
        <div className="editor-section__heading"><span>04</span><div><p className="eyebrow">Portafolio</p><h2>Proyectos y reconocimientos</h2></div></div>
        <div className="editor-array">
          <ArrayHeader title="Proyectos" description="Explica el rol, tecnologías, enlace y si es un proyecto académico." onAdd={() => setContent((previous) => ({ ...previous, projects: [...previous.projects, blankProject()] }))} />
          {content.projects.map((item, index) => <div className="array-card" key={`project-${index}`}><RemoveButton onClick={() => setContent((previous) => ({ ...previous, projects: previous.projects.filter((_, row) => row !== index) }))} /><div className="form-grid form-grid--three"><Field label="Nombre"><input value={item.title} onChange={(event) => setProject(index, "title", event.target.value)} /></Field><Field label="Rol"><input value={item.role} onChange={(event) => setProject(index, "role", event.target.value)} /></Field><Field label="Año"><input value={item.year} onChange={(event) => setProject(index, "year", event.target.value)} /></Field></div><div className="form-grid form-grid--two"><Field label="Tecnologías o enfoque"><input value={item.technologies} onChange={(event) => setProject(index, "technologies", event.target.value)} /></Field><Field label="Enlace"><input type="url" value={item.url} onChange={(event) => setProject(index, "url", event.target.value)} placeholder="https://…" /></Field></div><Field label="Descripción"><textarea rows={3} value={item.description} onChange={(event) => setProject(index, "description", event.target.value)} placeholder="Describe el problema, participación y resultado de forma verificable." /></Field><label className="checkbox-field"><input type="checkbox" checked={item.academic} onChange={(event) => setProject(index, "academic", event.target.checked)} /> Proyecto académico</label></div>)}
        </div>
        <div className="editor-array">
          <ArrayHeader title="Reconocimientos" description="Incluye distinciones, participación o logros que puedas sostener." onAdd={() => setContent((previous) => ({ ...previous, achievements: [...previous.achievements, blankAchievement()] }))} />
          {content.achievements.map((item, index) => <div className="array-card" key={`achievement-${index}`}><RemoveButton onClick={() => setContent((previous) => ({ ...previous, achievements: previous.achievements.filter((_, row) => row !== index) }))} /><div className="form-grid form-grid--three"><Field label="Título"><input value={item.title} onChange={(event) => setAchievement(index, "title", event.target.value)} /></Field><Field label="Institución"><input value={item.issuer} onChange={(event) => setAchievement(index, "issuer", event.target.value)} /></Field><Field label="Año"><input value={item.year} onChange={(event) => setAchievement(index, "year", event.target.value)} /></Field></div><Field label="Descripción"><textarea rows={2} value={item.description} onChange={(event) => setAchievement(index, "description", event.target.value)} /></Field></div>)}
        </div>
      </section>

      <section className="editor-section">
        <div className="editor-section__heading"><span>05</span><div><p className="eyebrow">Competencias</p><h2>Habilidades, cursos y enlaces</h2></div></div>
        <div className="editor-array">
          <ArrayHeader title="Habilidades por categoría" description="Separa competencias técnicas, profesionales u otras categorías relevantes." onAdd={() => setContent((previous) => ({ ...previous, skills: [...previous.skills, blankSkillGroup()] }))} />
          {content.skills.map((item, index) => <div className="array-row array-row--two" key={`skill-${index}`}><Field label="Categoría"><input value={item.category} onChange={(event) => setSkillGroup(index, { category: event.target.value })} placeholder="Ej. Habilidades profesionales" /></Field><Field label="Habilidades (separadas por coma)"><input value={item.items.join(", ")} onChange={(event) => setSkillGroup(index, { items: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} placeholder="Liderazgo, trabajo en equipo" /></Field><RemoveButton onClick={() => setContent((previous) => ({ ...previous, skills: previous.skills.filter((_, row) => row !== index) }))} /></div>)}
        </div>
        <div className="editor-array">
          <ArrayHeader title="Cursos y certificaciones" description="Agrega la entidad o estado cuando aplique." onAdd={() => setContent((previous) => ({ ...previous, courses: [...previous.courses, blankCourse()] }))} />
          {content.courses.map((item, index) => <div className="array-row array-row--two" key={`course-${index}`}><Field label="Curso o certificado"><input value={item.title} onChange={(event) => setCourse(index, "title", event.target.value)} /></Field><Field label="Estado o emisor"><input value={item.status} onChange={(event) => setCourse(index, "status", event.target.value)} /></Field><RemoveButton onClick={() => setContent((previous) => ({ ...previous, courses: previous.courses.filter((_, row) => row !== index) }))} /></div>)}
        </div>
        <div className="form-grid form-grid--two editor-single-row"><Field label="Idiomas (separados por coma)"><input value={content.languages.join(", ")} onChange={(event) => setContent((previous) => ({ ...previous, languages: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) }))} placeholder="Inglés B2, Español nativo" /></Field><Field label="Plantilla predeterminada del PDF"><select value={content.pdfTemplate} onChange={(event) => setContent((previous) => ({ ...previous, pdfTemplate: event.target.value === "modern" ? "modern" : "classic" }))}><option value="classic">Clásica - azul profundo</option><option value="modern">Moderna - acento amarillo</option></select></Field></div>
        <div className="editor-array">
          <ArrayHeader title="Enlaces" description="Solo URLs públicas seguras que quieras mostrar en el perfil." onAdd={() => setContent((previous) => ({ ...previous, links: [...previous.links, blankLink()] }))} />
          {content.links.map((item, index) => <div className="array-row array-row--two" key={`link-${index}`}><Field label="Etiqueta"><input value={item.label} onChange={(event) => setLink(index, "label", event.target.value)} placeholder="LinkedIn" /></Field><Field label="URL"><input type="url" value={item.url} onChange={(event) => setLink(index, "url", event.target.value)} placeholder="https://…" /></Field><RemoveButton onClick={() => setContent((previous) => ({ ...previous, links: previous.links.filter((_, row) => row !== index) }))} /></div>)}
        </div>
      </section>

      <footer className="editor-footer"><p><FileUp size={16} /> El borrador está aislado de la página pública. Al publicar se crea un snapshot nuevo.</p><div><a className="button button--secondary" href={previewHref}><Eye size={16} /> Previsualizar</a><button type="submit" className="button button--secondary" disabled={pendingAction !== null}><Save size={16} /> {pendingAction === "save" ? "Guardando…" : "Guardar borrador"}</button><button type="button" onClick={() => void runProfileAction(publishAction, "publish")} className="button button--primary" disabled={!canPublish || pendingAction !== null}><Send size={16} /> {pendingAction === "publish" ? "Publicando…" : "Publicar"}</button></div></footer>
    </form>
  );
}
